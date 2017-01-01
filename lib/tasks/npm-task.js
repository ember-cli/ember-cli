'use strict';

// Runs `npm install` in cwd

var chalk = require('chalk');
var Task = require('../models/task');

module.exports = Task.extend({
  // The command to run: can be 'install' or 'uninstall'
  command: '',

  init() {
    this._super.apply(this, arguments);
    this.npm = this.npm || require('../utilities/npm');
  },

  run(options) {
    var ui = this.ui;
    var startMessage = this.formatStartMessage(options.packages);
    var completeMessage = this.formatCompleteMessage(options.packages);

    ui.startProgress(chalk.green(startMessage));

    var args = [this.command];

    if (options.save) {
      args.push('--save');
    }

    if (options['save-dev']) {
      args.push('--save-dev');
    }

    if (options['save-exact']) {
      args.push('--save-exact');
    }

    if ('optional' in options && !options.optional) {
      args.push('--no-optional');
    }

    if (options.verbose) {
      args.push('--loglevel verbose');
    } else {
      args.push('--loglevel error');
    }

    if (options.packages) {
      args = args.concat(options.packages);
    }

    return this.npm(args)
      .finally(function() {
        ui.stopProgress();
      })
      .then(function() {
        ui.writeLine(chalk.green(completeMessage));
      });
  },

  formatStartMessage(/* packages */) {
    return '';
  },

  formatCompleteMessage(/* packages */) {
    return '';
  },
});
