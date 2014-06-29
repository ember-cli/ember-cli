'use strict';

var Task    = require('../models/task');
var Promise = require('../ext/promise');

module.exports = Task.extend({
  init: function() {
    this.testem = this.testem || new (require('testem'))();
  },
  invokeTestem: function (testemOptions) {
    return new Promise(function(resolve) {
      this.testem.startCI(testemOptions, resolve);
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
