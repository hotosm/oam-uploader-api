'use strict';
var fs = require('fs');
var path = require('path');

module.exports = [
  {
    method: 'POST',
    path: '/direct-upload',
    config: {

      payload: {
        output: 'stream',
        parse: true,
        allow: 'multipart/form-data'
      },

      handler: function (request, reply) {
        var data = request.payload;
        if (data.filefield.hapi.filename) {
          var name = data.filefield.hapi.filename;
          var outPath = path.join(__dirname, '../uploads', name);
          var file = fs.createWriteStream(outPath);

          file.on('error', function (err) {
            console.error(err);
          });

          data.filefield.pipe(file);

          data.filefield.on('end', function (err) {
            var ret = {
              filename: data.filefield.hapi.filename,
              headers: data.filefield.hapi.headers
            };
            console.log(data);
            reply(JSON.stringify(ret));
          });
        }
      }
    }
  }
];
