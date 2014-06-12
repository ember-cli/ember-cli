'use strict';

var Task    = require('../models/task');
var Testem  = require('testem');
var Promise = require('../ext/promise');

module.exports = Task.extend({
  invokeTestem: function (testemOptions) {
    var testem = new Testem();

    testem.startCI(testemOptions);
  },

  run: function(options) {
    var testemOptions = { file: options.configFile, port: options.port, cwd: 'tmp/output' };

    this.invokeTestem(testemOptions);

    return Promise.resolve();
  }
});
