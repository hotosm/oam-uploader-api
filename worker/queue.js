var MongoClient = require('mongodb').MongoClient;
var moment = require('moment');
var Promise = require('es6-promise').Promise;
var promisify = require('es6-promisify');
var processImage = require('./process-image');
var log = require('./log');
var config = require('../config');

module.exports = JobQueue;

function JobQueue (s3) {
  if (!(this instanceof JobQueue)) { return new JobQueue(s3); }
  this.s3 = s3;
}

JobQueue.prototype.run = function () {
  return this._initialize()
  .then(this._mainloop.bind(this));
};

JobQueue.prototype._initialize = function init () {
  if (this._initialized) { return Promise.resolve(true); }
  this._initialized = true;
  return promisify(MongoClient.connect.bind(MongoClient))(config.dbUri)
  .then((connection) => {
    this.db = connection;
    this.workers = this.db.collection('workers');
    this.images = this.db.collection('images');

    return this.workers.insertOne({ state: 'working' })
    .then((result) => {
      this.workerId = result.ops[0]._id;
      log.workerId = this.workerId;
      this._setupQueries();
      log('Initialized');
    })
    .catch(this.cleanup.bind(this));
  });
};

JobQueue.prototype._setupQueries = function _setupQueries () {
  // mongodb queries and updates
  this.query = {};
  this.query.myself = { _id: this.workerId, state: 'working' };

  this.update = {};
  this.update.lastJobTimestamp = { $currentDate: { lastJobTimestamp: true } };
  this.update.stopping = { $set: { state: 'stopping' } };
  this.update.jobClaimed = {
    $set: { status: 'processing', _workerId: this.workerId },
    $currentDate: { startedAt: true }
  };
  this.update.jobFinished = function jobFinished (processed) {
    return {
      $set: {
        status: 'finished',
        messages: processed.messages,
        metadata: processed.metadata
      },
      $unset: { _workerId: '' },
      $currentDate: { stoppedAt: true }
    };
  };
  this.update.jobErrored = function jobErrored (error) {
    error = {
      message: error.message,
      data: JSON.stringify(error)
    };
    return {
      $set: { status: 'errored', error: error },
      $unset: { _workerId: '' },
      $currentDate: { stoppedAt: true }
    };
  };
};

// main loop
JobQueue.prototype._mainloop = function mainloop () {
  return this.images
  // look for an unprocessed image that hasn't been claimed, and (atomically)
  // mark it as claimed by this worker
  .findOneAndUpdate({
    status: 'initial'
  }, this.update.jobClaimed, { returnOriginal: false })
  .then((result) => {
    if (!result.value) {
      // no jobs left; try to shut down.
      // avoid race condition by making sure our state wasn't changed from
      // 'working' to something else (by the server) before we actually quit.
      return this.workers.updateOne(this.query.myself, this.update.stopping)
      .then((result) => {
        // failed to set our state, so continue processing
        if (result.modifiedCount === 0) { return this._mainloop(); }
        // we're in the clear - clean up and exit
        return this.cleanup();
      })
      .catch(this.cleanup.bind(this));
    }

    // we got a job!
    var now = moment().format('YYYY-MM-DD');
    var image = result.value;
    var s3 = this.s3;
    log(['info'], 'Processing job', image);
    return this.db.collection('uploads')
    // find the upload / scene that contains this image
    .findOne({ 'scenes.images': image._id })
    .then(function (upload) {
      var found;
      upload.scenes.forEach(function (scene, i) {
        scene.images.forEach(function (id, j) {
          if (image._id.equals(id)) {
            var filename = image.url.split('/').pop() || 'untitled';
            var qmIndex = filename.indexOf('?');
            if (qmIndex !== -1) {
              filename = filename.substring(0, qmIndex);
            }
            filename = filename.replace(/[^a-zA-Z0-9 _\-\\.]/g, '').replace(/ /g, '-');
            filename = ['scene', i, 'image', j, filename].join('-');
            var keyFilename = filename.replace(/\.[^/.]+$/, '.tif');
            var key = ['uploads', now, upload._id, 'scene', i, keyFilename].join('/');
            // now that we have the scene, we can process the image
            found = processImage(s3, scene, image.url, key);
          }
        });
      });

      if (found) { return found; }
      // this should never happen
      throw new Error('Could not find the scene for image ' + image._id);
    })
    .then((processed) => {
      // mark the job as finished
      return this.images.findOneAndUpdate(result.value, this.update.jobFinished(processed));
    })
    .then(() => {
      // update this worker's timestamp
      return this.workers.updateOne(this.query.myself, this.update.lastJobTimestamp);
    })
    // keep going
    .then(this._mainloop.bind(this))
    .catch((error) => {
      log(['error'], error);
      return this.images.findOneAndUpdate(result.value, this.update.jobErrored(error))
      .then(() => {
        this.workers.updateOne(this.query.myself, this.update.lastJobTimestamp);
      })
      .then(this._mainloop.bind(this));
    });
  });
};

JobQueue.prototype.cleanup = function cleanup (err) {
  if (this._cleanupCalled) { return Promise.resolve(true); }
  this._cleanupCalled = true;
  log('Cleaning up.');
  if (err) { log(['error'], err, err.stack); }
  if (!this.db) { return Promise.resolve(true); }
  if (!this.workerId) { return this.db.close(); }

  return this.workers.deleteOne({ _id: this.workerId })
  .then(() => {
    return this.images.updateMany({ _workerId: this.workerId, status: 'processing' }, {
      $set: { status: 'initial' },
      $unset: { _workerId: '', startedAt: '' }
    });
  })
  .catch((error) => {
    log(['error'], 'Error cleaning up. Bad news.');
    log(['error'], error);
    this.db.close();
    throw error;
  })
  .then(() => { this.db.close(); })
  .then(function () { if (err) { throw err; } });
};
