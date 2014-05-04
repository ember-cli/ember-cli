'use strict';

var Task    = require('../models/task');
var Testem  = require('testem');
var Promise = require('../ext/promise');

module.exports = Task.extend({
  run: function(options) {
    return new Promise(function() {
      var testemOptions = { file: options.configFile };

      var watcher = options.watcher;
      var testem  = new Testem();
      testem.startDev(testemOptions, function(code) {
        process.exit(code);
      });

      watcher.on('change', function() {
        testem.restart();
      });
    });
  }
});
