'use strict';

var chalk = require('chalk');
var Task = require('../models/task');
var Watcher = require('../models/watcher');
var Builder = require('../models/builder');
var Promise = require('../ext/promise');

module.exports = Task.extend({
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
  },
});
