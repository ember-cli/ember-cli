'use strict';

const fs = require('fs');
const path = require('path');
const ExpressServer = require('./server/express-server');
const Task = require('../models/task');
const Watcher = require('../models/watcher');
const ServerWatcher = require('../models/server-watcher');
const Builder = require('../models/builder');
const SilentError = require('silent-error');
const serveURL = require('../utilities/get-serve-url');
const pDefer = require('p-defer');

function mockWatcher(distDir) {
  let watcher = Promise.resolve({ directory: distDir });
  watcher.on = () => {};
  return watcher;
}

function mockBuilder() {
  return {
    cleanup: () => Promise.resolve(),
  };
}

class ServeTask extends Task {
  constructor(options) {
    super(options);

    this._runDeferred = null;
    this._builder = null;
  }

  async run(options) {
    let hasBuild = !!options.path;

    if (hasBuild) {
      if (!fs.existsSync(options.path)) {
        throw new SilentError(
          `The path ${options.path} does not exist. Please specify a valid build directory to serve.`
        );
      }
      options._builder = mockBuilder();
      options._watcher = mockWatcher(options.path);
    }

    let builder = (this._builder =
      options._builder ||
      new Builder({
        ui: this.ui,
        outputPath: options.outputPath,
        project: this.project,
        environment: options.environment,
      }));

    let watcher =
      options._watcher ||
      (
        await Watcher.build({
          ui: this.ui,
          builder,
          options,
          serving: true,
          ignored: [path.resolve(this.project.root, options.outputPath)],
        })
      ).watcher;

    let serverRoot = './server';
    let serverWatcher = null;
    if (fs.existsSync(serverRoot)) {
      serverWatcher = (
        await ServerWatcher.build({
          ui: this.ui,
          watchedDir: path.resolve(serverRoot),
          options,
        })
      ).watcher;
    }

    let expressServer =
      options._expressServer ||
      new ExpressServer({
        ui: this.ui,
        project: this.project,
        watcher,
        serverRoot,
        serverWatcher,
      });

    /* hang until the user exits */
    this._runDeferred = pDefer();

    await expressServer.start(options);

    if (hasBuild) {
      this.ui.writeLine(`– Serving on ${serveURL(options, this.project)}`);
    }

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
    return this._runDeferred.resolve();
  }
}

module.exports = ServeTask;
