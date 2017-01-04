'use strict';

// Runs `bower install` in cwd
var path = require('path');
var existsSync = require('exists-sync');
var Promise = require('../ext/promise');
var Task = require('../models/task');
var formatPackageList = require('../utilities/format-package-list');

module.exports = Task.extend({
  init: function() {
    this._super.apply(this, arguments);
    this.bower = this.bower || require('bower');
    this.bowerConfig = this.bowerConfig || require('bower-config');
  },
  // Options: Boolean verbose
  run: function(options) {
    var chalk = require('chalk');
    var bower = this.bower;
    var bowerJson = path.join(this.project.root, '/bower.json');
    var bowerConfig = this.bowerConfig;
    var ui = this.ui;
    var packages = options.packages || [];
    var installOptions = options.installOptions || { save: true };

    if (!existsSync(bowerJson)) {
      ui.writeWarnLine('Skipping bower install: bower.json not found');
      return;
    }

    var startMessage = this.formatStartMessage(packages);
    var completeMessage = this.formatCompleteMessage(packages);

    ui.startProgress(chalk.green(startMessage));

    var config = bowerConfig.read(this.project.root);
    config.interactive = true;

    return new Promise(function(resolve, reject) {
      bower.commands.install(packages, installOptions, config) // Packages, options, config
        .on('log', logBowerMessage)
        .on('prompt', ui.prompt.bind(ui))
        .on('error', reject)
        .on('end', resolve);
    })
      .finally(function() { ui.stopProgress(); })
      .then(function() {
        ui.writeLine(chalk.green(completeMessage));
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
  },

  formatStartMessage: function(packages) {
    return 'Bower: Installing ' + formatPackageList(packages) + ' ...';
  },

  formatCompleteMessage: function(packages) {
    return 'Bower: Installed ' + formatPackageList(packages);
  },
});
