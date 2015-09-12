'use strict';

// Runs `bower install` in cwd

var Promise = require('../ext/promise');
var Task    = require('../models/task');

module.exports = Task.extend({
  init: function() {
    this.bower = this.bower || require('bower');
    this.bowerConfig = this.bowerConfig || require('bower-config');
    this.startProgressMessage = 'Installing packages via Bower';
    this.completionMessage = 'Installed packages via Bower.';
  },
  // Options: Boolean verbose
  run: function(options) {
    var chalk          = require('chalk');
    var bower          = this.bower;
    var bowerConfig    = this.bowerConfig;
    var ui             = this.ui;
    var self           = this;
    var packages       = options.packages || [];
    var installOptions = options.installOptions || { save: true };

    var config = bowerConfig.read();
    config.interactive = true;

    if (options.localCacheOnly) {
      config.offline = true;
      this.startProgressMessage += ' (using local cache only)';
      this.completionMessage += ' (using local cache only)';
    }

    ui.startProgress(chalk.green(this.startProgressMessage), chalk.green('.'));

    return new Promise(function(resolve, reject) {
        bower.commands.install(packages, installOptions, config) // Packages, options, config
          .on('log', logBowerMessage)
          .on('prompt', ui.prompt.bind(ui))
          .on('error', reject)
          .on('end', resolve);
      })
      .finally(function() { ui.stopProgress(); })
      .then(function() {
        ui.writeLine(chalk.green(self.completionMessage));
      });

    function logBowerMessage(message) {
      if (message.level === 'conflict') {
        // e.g.
        //   conflict Unable to find suitable version for ember-data
        //     1) ember-data 1.0.0-beta.6
        //     2) ember-data ~1.0.0-beta.7
        ui.writeLine('  ' + chalk.red('conflict') + ' ' + message.message);
        message.data.picks.forEach(function(pick, index) {
          ui.writeLine('    ' + chalk.green((index + 1) + ')') + ' ' +
                       message.data.name + ' ' + pick.endpoint.target);
        });
      } else if (message.level === 'info' && options.verbose) {
        // e.g.
        //   cached git://example.com/some-package.git#1.0.0
        ui.writeLine('  ' + chalk.green(message.id) + ' ' + message.message);
      }
    }
  }
});
