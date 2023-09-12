'use strict';

const chalk = require('chalk');
const Task = require('../models/task');
const Builder = require('../models/builder');

module.exports = class BuildTask extends Task {
  // Options: String outputPath
  async run(options) {
    let ui = this.ui;

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

      await builder.build(null, annotation);
    } finally {
      ui.stopProgress();
      await builder.cleanup();
    }

    ui.writeLine(chalk.green(`Built project successfully. Stored in "${options.outputPath}".`));
  }
};
