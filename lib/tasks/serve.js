'use strict';

const existsSync = require('exists-sync');
const path = require('path');
const ExpressServer = require('./server/express-server');
const RSVP = require('rsvp');
const Task = require('../models/task');
const Watcher = require('../models/watcher');
const ServerWatcher = require('../models/server-watcher');
const Builder = require('../models/builder');

class ServeTask extends Task {
  constructor(options) {
    super(options);

    this._runDeferred = null;
    this._builder = null;
  }

  run(options) {
    let builder = this._builder = options._builder || new Builder({
      ui: this.ui,
      outputPath: options.outputPath,
      project: this.project,
      environment: options.environment,
    });

    let watcher = options._watcher || new Watcher({
      ui: this.ui,
      builder,
      analytics: this.analytics,
      options,
      serving: true,
    });

    let serverRoot = './server';
    let serverWatcher = null;
    if (existsSync(serverRoot)) {
      serverWatcher = new ServerWatcher({
        ui: this.ui,
        analytics: this.analytics,
        watchedDir: path.resolve(serverRoot),
        options,
      });
    }

    let expressServer = options._expressServer || new ExpressServer({
      ui: this.ui,
      project: this.project,
      watcher,
      serverRoot,
      serverWatcher,
    });

    /* hang until the user exits */
    this._runDeferred = RSVP.defer();

    return expressServer.start(options).then(() => this._runDeferred.promise);
  }

  /**
   * Exit silently
   *
   * @private
   * @method onInterrupt
   */
  onInterrupt() {
    return this._builder.cleanup().then(() => this._runDeferred.resolve());
  }
}

module.exports = ServeTask;
