'use strict';

let chalk = require('chalk');
let Task = require('../models/task');
let Watcher = require('../models/watcher');
let Builder = require('../models/builder');
let Promise = require('../ext/promise');

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
