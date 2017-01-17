'use strict';

const chalk = require('chalk');
const Task = require('../models/task');
const Watcher = require('../models/watcher');
const Builder = require('../models/builder');
const Promise = require('rsvp').Promise;

class BuildWatchTask extends Task {
  run(options) {
    this.ui.startProgress(
      chalk.green('Building'), chalk.green('.')
    );

    return new Watcher({
      ui: this.ui,
      builder: new Builder({
        ui: this.ui,
        outputPath: options.outputPath,
        environment: options.environment,
        project: this.project,
      }),
      analytics: this.analytics,
      options,
    }).then(() => new Promise(() => {}) /* Run until failure or signal to exit */);
  }
}

module.exports = BuildWatchTask;
