'use strict';

var Task        = require('../models/task');
var Promise     = require('../ext/promise');
var SilentError = require('../errors/silent');

module.exports = Task.extend({
  init: function() {
    this.testem = this.testem || new (require('testem'))();
  },
  invokeTestem: function (testemOptions) {
    var testem = this.testem;

    return new Promise(function(resolve, reject) {
      testem.startCI(testemOptions, function(exitCode) {
        if (!testem.app.reporter.total) {
          reject(new SilentError('No tests were ran, please ensure that you have a test launcher (e.g. PhantomJS) enabled.'));
        }

        resolve(exitCode);
      });
    }.bind(this));
  },

  run: function(options) {
    var testemOptions = {
      file: options.configFile,
      port: options.port,
      cwd: options.outputPath
    };

    return this.invokeTestem(testemOptions);
  }
});
