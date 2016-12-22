'use strict';

var fs = require('fs');
var cp = require('child_process');
var tmp = require('tmp');
var promisify = require('es6-promisify');
var request = require('request');
var queue = require('queue-async');
var gdalinfo = require('gdalinfo-json');
var pathTools = require('path');
var applyGdalinfo = require('oam-meta-generator/lib/apply-gdalinfo');
var sharp = require('sharp');
var log = require('./log');
var config = require('../config');

var s3bucket = config.oinBucket;
// desired size in kilobytes * 1000 bytes/kb / (~.75 byte/pixel)
var targetPixelArea = config.thumbnailSize * 1000 / 0.75;

module.exports = promisify(_processImage);
/**
 * Fully process one URL.
 * Callback called with (err, { metadata, messages })
 */
function _processImage (s3, scene, url, key, cb) {
  var ext = pathTools.extname(url).toLowerCase();
  tmp.file({ postfix: ext }, function (err, path, fd, cleanupSource) {
    var callback = function (err, data) {
      cleanupSource();
      cb(err, data);
    };

    if (err) { return callback(err); }

    // Google drive url comes in the form of gdrive://FILE_ID
    // We need this because large files can only be downloaded with an api key.
    var pieces = url.match(/gdrive:\/\/(.+)/);
    if (pieces) {
      url = `https://www.googleapis.com/drive/v3/files/${pieces[1]}?alt=media&key=${config.gdriveKey}`;
    }

    var downloadStatus;
    var upload;
    var stream;
    var messages = [];

    // Open local read stream if file was uploaded
    if (url.substring(0, 7) === 'file://') {
      upload = pathTools.join(__dirname, '../', 'uploads', url.replace('file://', ''));
      log(['debug'], 'Transferring ' + upload + ' to ' + path);
      stream = fs.createReadStream(upload);
    } else {
      // Open a download stream if file is remote
      log(['debug'], 'Downloading ', url, ' to ', path);
      stream = request(url);
      stream.on('response', function (resp) { downloadStatus = resp.statusCode; });
    }

    // Write the stream
    stream
    .on('error', callback)
    .pipe(fs.createWriteStream(path))
    .on('finish', function () {
      if (downloadStatus < 200 || downloadStatus >= 400) {
        return callback(new Error('Could not download ' + url +
         '; server responded with status code ' + downloadStatus));
      }
      // Cleanup local files if direct upload
      if (url.substring(0, 7) === 'file://') {
        log(['debug'], 'Cleaning up uploaded file: ', upload);
        fs.unlink(upload, function (err) {
          if (err) return callback(err);
        });
      }

      // we've successfully downloaded the file.  now do stuff with it.
      tmp.file({ postfix: '.tif' }, function (err, tifPath, fd, cleanupTif) {
        if (err) { return callback(err); }

        translateImage(ext, path, tifPath, function (err, path) {
          callback = function (err, data) {
            cleanupSource();
            cleanupTif();
            cb(err, data);
          };

          if (err) { return callback(err); }

          generateMetadata(scene, path, key, function (err, metadata) {
            if (err) { return callback(err); }
            makeThumbnail(path, function (thumbErr, thumbPath) {
              if (thumbErr) {
                messages.push('Could not generate thumbnail: ' + thumbErr.message);
              }
              uploadToS3(s3, path, key, metadata, thumbPath, function (err) {
                callback(err, { metadata: metadata, messages: messages });
              });
            });
          });
        });
      });
    }).on('error', callback);
  });
}

function uploadToS3 (s3, path, key, metadata, thumbPath, callback) {
  var q = queue();

  // upload image
  q.defer(s3.upload.bind(s3), {
    Body: fs.createReadStream(path),
    Bucket: s3bucket,
    Key: key
  });

  // upload thumbnail, if we have one
  if (thumbPath) {
    q.defer(s3.upload.bind(s3), {
      Body: fs.createReadStream(thumbPath),
      Bucket: s3bucket,
      Key: key + '.thumb.png'
    });
    metadata.properties.thumbnail = publicUrl(s3bucket, key + '.thumb.png');
  }

  // upload metadata
  q.defer(s3.upload.bind(s3), {
    Body: JSON.stringify(metadata),
    Bucket: s3bucket,
    Key: key + '_meta.json'
  });

  log(['debug'], 'Uploading to s3; bucket=' + s3bucket + ' key=' + key);
  q.awaitAll(function (err) {
    if (err) { return callback(err); }
    log(['debug'], 'Finished uploading');
    callback();
  });
}

function translateImage (ext, path, tifPath, callback) {
  if (!config.gdalTranslateBin) {
    throw new Error('GDAL bin path missing.');
  }
  log(['debug'], 'Converting image to OAM standard format.');
  var args = [
    '-of', 'GTiff',
    path, tifPath,
    '-co', 'TILED=yes',
    '-co', 'COMPRESS=DEFLATE',
    '-co', 'PREDICTOR=2',
    '-co', 'SPARSE_OK=yes',
    '-co', 'BLOCKXSIZE=512',
    '-co', 'BLOCKYSIZE=512',
    '-co', 'NUM_THREADS=ALL_CPUS'
  ];

  cp.execFile(config.gdalTranslateBin, args, function (err, stdout, stderr) {
    if (err) { return callback(err); }
    log(['debug'], 'Converted image to OAM standard format. Input: ', path, 'Output: ', tifPath);
    return callback(null, tifPath);
  });
}

function generateMetadata (scene, path, key, callback) {
  log(['debug'], 'Generating metadata.');
  fs.stat(path, function (err, stat) {
    if (err) { return callback(err); }

    var metadata = {
      uuid: null,
      title: scene.title,
      projection: null,
      bbox: null,
      footprint: null,
      gsd: null,
      file_size: stat.size,
      acquisition_start: scene.acquisition_start,
      acquisition_end: scene.acquisition_end,
      platform: scene.platform,
      provider: scene.provider,
      contact: [scene.contact.name.replace(',', ';'), scene.contact.email].join(','),
      license: scene.license,
      tags: scene.tags,
      properties: {
        tms: scene.tms,
        sensor: scene.sensor
      }
    };

    gdalinfo.local(path, function (err, gdaldata) {
      if (err) { return callback(err); }
      applyGdalinfo(metadata, gdaldata);
      // set uuid after doing applyGdalinfo because it actually sets it to
      // gdaldata.url, which for us is blank since we used gdalinfo.local
      metadata.uuid = publicUrl(s3bucket, key);
      log(['debug'], 'Generated metadata: ', metadata);
      callback(null, metadata);
    });
  });
}

function makeThumbnail (imagePath, callback) {
  tmp.file({ postfix: '.png' }, function (err, path, fd) {
    if (err) { return callback(err); }
    log(['debug'], 'Generating thumbnail', path);

    var original = sharp(imagePath)
      // upstream: https://github.com/lovell/sharp/issues/250
      .limitInputPixels(2147483647)
      .sequentialRead();
    original
    .metadata()
    .then(function (metadata) {
      var pixelArea = metadata.width * metadata.height;
      var ratio = Math.sqrt(targetPixelArea / pixelArea);
      log(['debug'], 'Generating thumbnail, targetPixelArea=' + targetPixelArea);
      original
      .resize(Math.round(ratio * metadata.width))
      .toFile(path)
      .then(function () {
        log(['debug'], 'Finished generating thumbnail');
        callback(null, path);
      });
    })
    .catch(callback);
  });
}

function publicUrl (bucketName, key) {
  return 'http://' + bucketName + '.s3.amazonaws.com/' + key;
}
