'use strict';

const chalk = require('chalk');
const Task = require('../models/task');
const Builder = require('../models/builder');

module.exports = class BuildTask extends Task {
  // Options: String outputPath
  async run(options) {
    let ui = this.ui;
    let analytics = this.analytics;

    let builder = new Builder({
      ui,
      outputPath: options.outputPath,
      environment: options.environment,
      project: this.project,
    });

    try {
      ui.startProgress(chalk.green('Building'), chalk.green('.'));

      ui.writeLine(`Environment: ${options.environment}`);

      let annotation = {
        type: 'initial',
        reason: 'build',
        primaryFile: null,
        changedFiles: [],
      };

      let results = await builder.build(null, annotation);
      let totalTime = results.totalTime / 1e6;

      analytics.track({
        name: 'ember build',
        message: `${totalTime}ms`,
      });

      /*
       * We use the `rebuild` category in our analytics setup for both builds
       * and rebuilds. This is a bit confusing, but the actual thing we
       * delineate on in the reports is the `variable` value below. This is
       * used both here and in `lib/models/watcher.js`.
       */
      analytics.trackTiming({
        category: 'rebuild',
        variable: 'build time',
        label: 'broccoli build time',
        value: parseInt(totalTime, 10),
      });
    } finally {
      ui.stopProgress();
      await builder.cleanup();
    }

    ui.writeLine(chalk.green(`Built project successfully. Stored in "${options.outputPath}".`));
  }
};
