'use strict';

// Runs `npm install` in cwd

var chalk = require('chalk');
var Task  = require('../models/task');

module.exports = Task.extend({
  // The command to run: can be 'install' or 'uninstall'
  command: '',
  // Message to send to ui.startProgress
  startProgressMessage: '',
  // Message to send to ui.writeLine on completion
  completionMessage: '',

  init: function() {
    this._super.apply(this, arguments);
    this.npm = this.npm || require('../utilities/npm');
  },

  run: function(options) {
    this.ui.startProgress(chalk.green(this.startProgressMessage), chalk.green('.'));

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
      .finally(this.finally.bind(this))
      .then(this.announceCompletion.bind(this));
  },

  announceCompletion: function() {
    this.ui.writeLine(chalk.green(this.completionMessage));
  },

  finally: function() {
    this.ui.stopProgress();
  }
});
