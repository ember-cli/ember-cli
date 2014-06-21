'use strict';

var Task    = require('../models/task');
var Testem  = require('testem');
var Promise = require('../ext/promise');

module.exports = Task.extend({
  invokeTestem: function (testemOptions) {
    var testem = new Testem();

    return new Promise(function(resolve) {
      testem.startCI(testemOptions, function(exitCode) {
        resolve(exitCode);
      });
    });
  },

  run: function(options) {
    var testemOptions = { file: options.configFile, port: options.port, cwd: options.outputPath };

    return this.invokeTestem(testemOptions);
  }
});
