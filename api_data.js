define({ "api": [
  {
    "type": "get",
    "url": "/uploads",
    "title": "List uploads of currently authenticated user.",
    "group": "uploads",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "results",
            "description": ""
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "results.uploader",
            "description": "<p>Uploader contact info</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.uploader.name",
            "description": ""
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.uploader.email",
            "description": ""
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "results.scenes",
            "description": ""
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "results.scenes.contact",
            "description": "<p>Contact person for this scene</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.scenes.contact.name",
            "description": ""
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.scenes.contact.email",
            "description": ""
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.scenes.title",
            "description": "<p>Scene title</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "allowedValues": [
              "\"satellite\"",
              "\"aircraft\"",
              "\"UAV\"",
              "\"balloon\"",
              "\"kite\""
            ],
            "optional": false,
            "field": "results.scenes.platform",
            "description": ""
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.scenes.provider",
            "description": "<p>Imagery provider</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.scenes.sensor",
            "description": "<p>Sensor/device</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.scenes.acquisition_start",
            "description": "<p>Date and time of imagery acquisition</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.scenes.acquisition_end",
            "description": "<p>Date and time of imagery acquisition</p>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "results.scenes.images",
            "description": "<p>Array of images in this scene</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.scenes.images.url",
            "description": ""
          },
          {
            "group": "Success 200",
            "type": "String",
            "allowedValues": [
              "\"initial\"",
              "\"processing\"",
              "\"finished\"",
              "\"errored\""
            ],
            "optional": false,
            "field": "results.scenes.images.status",
            "description": ""
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.scenes.images.error",
            "description": ""
          },
          {
            "group": "Success 200",
            "type": "String[]",
            "optional": false,
            "field": "results.scenes.images.messages",
            "description": ""
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.scenes.images.startedAt",
            "description": "<p>Date and time the processing started</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.scenes.images.stoppedAt",
            "description": "<p>Date and time the processing stopped</p>"
          }
        ]
      }
    },
    "permission": [
      {
        "name": "Token",
        "title": "API Token Authentication",
        "description": "<p>API token must be included either as an HTTP <code>Bearer: your-token</code> header or as a query parameter <code>?access_token=your-token</code> <a href=\"https://github.com/hotosm/oam-uploader\">Request a token</a>.</p>"
      }
    ],
    "version": "0.0.0",
    "filename": "routes/uploads.js",
    "groupTitle": "uploads",
    "name": "GetUploads"
  },
  {
    "type": "get",
    "url": "/uploads/:id",
    "title": "Get the status of a given upload",
    "group": "uploads",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "id",
            "description": "<p>The id of the upload</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/uploads.js",
    "groupTitle": "uploads",
    "name": "GetUploadsId",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "results.uploader",
            "description": "<p>Uploader contact info</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.uploader.name",
            "description": ""
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.uploader.email",
            "description": ""
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "results.scenes",
            "description": ""
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "results.scenes.contact",
            "description": "<p>Contact person for this scene</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.scenes.contact.name",
            "description": ""
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.scenes.contact.email",
            "description": ""
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.scenes.title",
            "description": "<p>Scene title</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "allowedValues": [
              "\"satellite\"",
              "\"aircraft\"",
              "\"UAV\"",
              "\"balloon\"",
              "\"kite\""
            ],
            "optional": false,
            "field": "results.scenes.platform",
            "description": ""
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.scenes.provider",
            "description": "<p>Imagery provider</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.scenes.sensor",
            "description": "<p>Sensor/device</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.scenes.acquisition_start",
            "description": "<p>Date and time of imagery acquisition</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.scenes.acquisition_end",
            "description": "<p>Date and time of imagery acquisition</p>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "results.scenes.images",
            "description": "<p>Array of images in this scene</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.scenes.images.url",
            "description": ""
          },
          {
            "group": "Success 200",
            "type": "String",
            "allowedValues": [
              "\"initial\"",
              "\"processing\"",
              "\"finished\"",
              "\"errored\""
            ],
            "optional": false,
            "field": "results.scenes.images.status",
            "description": ""
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.scenes.images.error",
            "description": ""
          },
          {
            "group": "Success 200",
            "type": "String[]",
            "optional": false,
            "field": "results.scenes.images.messages",
            "description": ""
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.scenes.images.startedAt",
            "description": "<p>Date and time the processing started</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.scenes.images.stoppedAt",
            "description": "<p>Date and time the processing stopped</p>"
          }
        ]
      }
    }
  },
  {
    "type": "post",
    "url": "/uploads",
    "title": "Add an upload to the queue",
    "group": "uploads",
    "permission": [
      {
        "name": "Token",
        "title": "API Token Authentication",
        "description": "<p>API token must be included either as an HTTP <code>Bearer: your-token</code> header or as a query parameter <code>?access_token=your-token</code> <a href=\"https://github.com/hotosm/oam-uploader\">Request a token</a>.</p>"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "uploaderInfo",
            "description": ""
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "contactInfo",
            "description": ""
          },
          {
            "group": "Parameter",
            "type": "Object[]",
            "optional": false,
            "field": "scenes",
            "description": ""
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "scenes.metadata",
            "description": "<p>The OAM metadata</p>"
          },
          {
            "group": "Parameter",
            "type": "string[]",
            "optional": false,
            "field": "scenes.urls",
            "description": "<p>The image URLs</p>"
          }
        ]
      }
    },
    "examples": [
      {
        "title": "Example post",
        "content": "{\n  \"uploader\": {\n    \"name\": \"Lady Stardust\",\n    \"email\": \"lady@stardust.xyz\"\n  },\n  \"scenes\": [\n    {\n      \"contact\": {\n        \"name\": \"Sat E Lyte\",\n        \"email\": \"foo@bar.com\"\n      },\n      \"title\": \"A scene title\",\n      \"platform\": \"UAV\",\n      \"provider\": \"Drones R Us\",\n      \"sensor\": \"DroneModel01\",\n      \"acquisition_start\": \"2015-04-01T00:00:00.000\",\n      \"acquisition_end\": \"2015-04-30T00:00:00.000\",\n      \"urls\": [\n        \"http://dron.es/image1.tif\",\n        \"http://dron.es/image2.tif\",\n        \"http://dron.es/image3.tif\",\n      ]\n    },\n    {\n      \"contact\": {\n        \"name\": \"Someone Else\",\n        \"email\": \"birds@eye.view.com\"\n      },\n      \"title\": \"Another title\",\n      \"platform\": \"satellite\",\n      \"provider\": \"Satellites R Us\",\n      \"sensor\": \"SATELLITE_I\",\n      \"acquisition_start\": \"2015-04-01T00:00:00.000\",\n      \"acquisition_end\": \"2015-04-30T00:00:00.000\",\n      \"urls\": [\n        \"http://satellit.es/image1.tif\",\n        \"http://satellit.es/image2.tif\",\n      ]\n    }\n  ]\n}",
        "type": "js"
      }
    ],
    "version": "0.0.0",
    "filename": "routes/uploads.js",
    "groupTitle": "uploads",
    "name": "PostUploads"
  }
] });
