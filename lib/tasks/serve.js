'use strict';

const existsSync = require('exists-sync');
const path = require('path');
const LiveReloadServer = require('./server/livereload-server');
const ExpressServer = require('./server/express-server');
const Promise = require('rsvp').Promise;
const Task = require('../models/task');
const Watcher = require('../models/watcher');
const ServerWatcher = require('../models/server-watcher');
const Builder = require('../models/builder');

class ServeTask extends Task {
  run(options) {
    let builder = new Builder({
      ui: this.ui,
      outputPath: options.outputPath,
      project: this.project,
      environment: options.environment,
    });

    let watcher = new Watcher({
      ui: this.ui,
      builder,
      analytics: this.analytics,
      options,
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

    let expressServer = new ExpressServer({
      ui: this.ui,
      project: this.project,
      watcher,
      serverRoot,
      serverWatcher,
    });

    let liveReloadServer = new LiveReloadServer({
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
      watcher,
      expressServer,
    });

    return Promise.all([
      liveReloadServer.start(options),
      expressServer.start(options),
    ]).then(() => new Promise(() => {}) /* hang until the user exits. */);
  }
}

module.exports = ServeTask;
