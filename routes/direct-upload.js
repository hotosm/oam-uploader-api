'use strict';
var fs = require('fs');
var path = require('path');

module.exports = [
  {
    method: 'POST',
    path: '/direct-upload',
    config: {
      auth: 'api-token',
      payload: {
        maxBytes: 53687091200,
        output: 'stream',
        parse: true,
        allow: 'multipart/form-data'
      },

      handler: function (request, reply) {
        var data = request.payload;
        if (data.file.hapi.filename) {
          var outPath = path.join(__dirname, '../uploads', data.newName);
          var file = fs.createWriteStream(outPath);

          file.on('error', function (err) {
            console.error(err);
          });

          data.file.pipe(file);

          data.file.on('end', function (err) {
            if (err) {
              console.log(err);
            }
            var ret = {
              filename: data.file.hapi.filename,
              headers: data.file.hapi.headers
            };
            reply(JSON.stringify(ret));
          });
        }
      }
    }
  }
];
