'use strict';

var promisify = require('es6-promisify');
var gdalinfo = require('gdalinfo-json');
var applyGdalinfo = require('oam-meta-generator/lib/apply-gdalinfo');
var request = require('request');
var log = require('./log');
var config = require('../config');

var s3bucket = config.oinBucket;
var jobDefinition = config.jobDefinition;
var jobQueue = config.jobQueue;

if (jobDefinition == null || jobQueue == null) {
  throw new Error('JOB_DEFINITION and JOB_QUEUE must be provided.');
}

module.exports = promisify(_processImage);

/**
 * Fully process one URL.
 * Callback called with (err, { metadata, messages })
 */
function _processImage (aws, scene, url, targetPrefix, callback) {
  // Google drive url comes in the form of gdrive://FILE_ID
  // We need this because large files can only be downloaded with an api key.
  var pieces = url.match(/gdrive:\/\/(.+)/);
  if (pieces) {
    url = `https://www.googleapis.com/drive/v3/files/${pieces[1]}?alt=media&key=${config.gdriveKey}`;
  }

  var batch = new aws.Batch();
  var s3 = new aws.S3();

  // TODO use async.waterfall
  return queueTranscodeJob(batch, url, targetPrefix, function (err) {
    if (err) {
      return callback(err);
    }

    return generateMetadata(scene, url, targetPrefix, function (err, metadata) {
      if (err) {
        return callback(err);
      }

      return uploadMetadata(s3, targetPrefix, metadata, function (err) {
        return callback(err, {
          metadata: metadata
        });
      });
    });
  });
}

function uploadMetadata (s3, targetPrefix, metadata, callback) {
  return s3.upload({
    Body: JSON.stringify(metadata),
    Bucket: s3bucket,
    Key: targetPrefix + '_meta.json'
  }, callback);
}

function queueTranscodeJob (batch, input, output, callback) {
  return batch.submitJob({
    jobDefinition: jobDefinition,
    jobName: 'transcode-' + new Date().toISOString(),
    jobQueue: jobQueue
  }, callback);
}

// TODO merge w/ process-image.generateMetadata
function generateMetadata (scene, url, key, callback) {
  log(['debug'], 'Generating metadata.');
  return request.head(url, function (err, rsp) {
    if (err) {
      return callback(err);
    }

    if (rsp.statusCode !== 200) {
      return callback(new Error('Could not fetch ' + url));
    }

    var metadata = {
      uuid: null,
      title: scene.title,
      projection: null,
      bbox: null,
      footprint: null,
      gsd: null,
      file_size: Number(rsp.headers['content-length']),
      acquisition_start: scene.acquisition_start,
      acquisition_end: scene.acquisition_end,
      platform: scene.platform,
      provider: scene.provider,
      contact: [scene.contact.name.replace(',', ';'), scene.contact.email].join(','),
      properties: {
        tms: scene.tms,
        sensor: scene.sensor
      }
    };

    return gdalinfo.remote(url, function (err, gdaldata) {
      if (err) {
        return callback(err);
      }

      applyGdalinfo(metadata, gdaldata);
      // set uuid after doing applyGdalinfo because it actually sets it to
      // gdaldata.url, which for us is blank since we used gdalinfo.local
      metadata.uuid = publicUrl(s3bucket, key);
      log(['debug'], 'Generated metadata: ', metadata);
      return callback(null, metadata);
    });
  });
}

// TODO move to .
function publicUrl (bucketName, key) {
  return 'http://' + bucketName + '.s3.amazonaws.com/' + key;
}
