'use strict';

// Runs `npm install` in cwd

const chalk = require('chalk');
const Task = require('../models/task');

class NpmTask extends Task {

  constructor(options) {
    super(options);

    // The command to run: can be 'install' or 'uninstall'
    this.command = '';

    this.npm = this.npm || require('../utilities/npm');
  }

  run(options) {
    let ui = this.ui;
    let startMessage = this.formatStartMessage(options.packages);
    let completeMessage = this.formatCompleteMessage(options.packages);

    ui.startProgress(chalk.green(startMessage));

    let args = [this.command];

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
      .finally(() => ui.stopProgress())
      .then(() => ui.writeLine(chalk.green(completeMessage)));
  }

  formatStartMessage(/* packages */) {
    return '';
  }

  formatCompleteMessage(/* packages */) {
    return '';
  }
}

module.exports = NpmTask;
