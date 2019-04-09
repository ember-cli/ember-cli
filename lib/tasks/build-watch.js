'use strict';

const chalk = require('chalk');
const Task = require('../models/task');
const Watcher = require('../models/watcher');
const Builder = require('../models/builder');
const pDefer = require('p-defer');

class BuildWatchTask extends Task {
  constructor(options) {
    super(options);

    this._builder = null;
    this._runDeferred = null;
  }

  async run(options) {
    let { ui } = this;

    ui.startProgress(chalk.green('Building'), chalk.green('.'));

    this._runDeferred = pDefer();

    let builder = (this._builder =
      options._builder ||
      new Builder({
        ui,
        outputPath: options.outputPath,
        environment: options.environment,
        project: this.project,
      }));

    ui.writeLine(`Environment: ${options.environment}`);

    let watcher =
      options._watcher ||
      new Watcher({
        ui,
        builder,
        analytics: this.analytics,
        options,
      });

    await watcher;
    // Run until failure or signal to exit
    return this._runDeferred.promise;
  }

  /**
   * Exit silently
   *
   * @private
   * @method onInterrupt
   */
  async onInterrupt() {
    await this._builder.cleanup();
    this._runDeferred.resolve();
  }
}

module.exports = BuildWatchTask;
