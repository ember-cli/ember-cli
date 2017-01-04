'use strict';

let existsSync = require('exists-sync');
let path = require('path');
let LiveReloadServer = require('./server/livereload-server');
let ExpressServer = require('./server/express-server');
let Promise = require('../ext/promise');
let Task = require('../models/task');
let Watcher = require('../models/watcher');
let ServerWatcher = require('../models/server-watcher');
let Builder = require('../models/builder');

module.exports = Task.extend({
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
  },
});
