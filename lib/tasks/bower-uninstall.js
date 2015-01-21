'use strict';

// Runs `bower uninstall` in cwd

var Promise = require('../ext/promise');
var Task    = require('../models/task');

module.exports = Task.extend({
  init: function() {
    this.bower = this.bower || require('bower');
    this.bowerConfig = this.bowerConfig || require('bower-config');
  },
  // Options: Boolean verbose
  run: function(options) {
    var chalk            = require('chalk');
    var bower            = this.bower;
    var bowerConfig      = this.bowerConfig;
    var ui               = this.ui;
    var packages         = options.packages || [];
    var uninstallOptions = { save: true };
    var packageNames     = packages.join(', ');

    ui.pleasantProgress.start(chalk.green('Uninstalling Bower packages: '+packageNames), chalk.green('.'));

    var config = bowerConfig.read();
    config.interactive = true;

    return new Promise(function(resolve, reject) {
        bower.commands.uninstall(packages, uninstallOptions, config) // Packages, options, config
          .on('prompt', ui.prompt.bind(ui))
          .on('error', reject)
          .on('end', resolve);
      })
      .finally(function() { ui.pleasantProgress.stop(); })
      .then(function() {
        ui.writeLine(chalk.green('Bower packages uninstalled: '+packageNames));
      });
  }
});
