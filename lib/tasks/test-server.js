'use strict';

var Task    = require('../models/task');
var Testem  = require('testem');
var Promise = require('../ext/promise');
var rimraf  = Promise.denodeify(require('rimraf'));
var chalk   = require('chalk');

module.exports = Task.extend({
  run: function(options) {
    var ui = this.ui;

    ui.pleasantProgress.start(chalk.green('Building'), chalk.green('.'));

    // Don't start the tests until we've finished building
    return options.watcher.builder.build().then(function() {
      ui.pleasantProgress.stop();

      var testemOptions = { file: options.configFile, port: options.port, cwd: options.liveOutputDir };

      var watcher = options.watcher;
      var testem  = new Testem();
      testem.startDev(testemOptions, function(code) {
        rimraf(options.liveOutputDir)
          .finally(function() {
            process.exit(code);
          });
      });

      watcher.on('change', function() {
        testem.restart();
      });
    });
  }
});
