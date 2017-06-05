'use strict';

const Promise = require('rsvp').Promise;
const fs = require('fs');
const Task = require('../../models/task');
const SilentError = require('silent-error');
const walkSync = require('walk-sync');
const path = require('path');
const FSTree = require('fs-tree-diff');
const logger = require('heimdalljs-logger')('ember-cli:live-reload:');

function createServer(options) {
  let instance;

  const Server = (require('tiny-lr')).Server;
  Server.prototype.error = function() {
    instance.error.apply(instance, arguments);
  };
  instance = new Server(options);
  return instance;
}

function isNotRemoved(entryTuple) {
  let operation = entryTuple[0];
  return operation !== 'unlink' && operation !== 'rmdir';
}

function isNotDirectory(entryTuple) {
  let entry = entryTuple[2];
  return entry && !entry.isDirectory();
}

function relativePath(patch) {
  return patch[1];
}

function isNotSourceMapFile(file) {
  return !(/\.map$/.test(file));
}

class LiveReloadServerTask extends Task {
  liveReloadServer(options) {
    if (this._liveReloadServer) {
      return this._liveReloadServer;
    }

    this._liveReloadServer = createServer(options);
    return this._liveReloadServer;
  }

  listen(options) {
    let server = this.liveReloadServer(options);

    return new Promise((resolve, reject) => {
      server.error = reject;
      server.listen(options.port, options.host, resolve);
    });
  }

  start(options) {
    let tlroptions = {};

    tlroptions.ssl = options.ssl;
    tlroptions.host = options.liveReloadHost || options.host;
    tlroptions.port = options.liveReloadPort;

    if (options.liveReload !== true) {
      return Promise.resolve('Livereload server manually disabled.');
    }

    if (options.ssl) {
      tlroptions.key = fs.readFileSync(options.sslKey);
      tlroptions.cert = fs.readFileSync(options.sslCert);
    }

    this.tree = new FSTree.fromEntries([]);

    // Reload on file changes
    this.watcher.on('change', function() {
      try {
        this.didChange.apply(this, arguments);
      } catch (e) {
        this.ui.writeError(e);
      }
    }.bind(this));

    this.watcher.on('error', this.didChange.bind(this));

    // Reload on express server restarts
    this.expressServer.on('restart', this.didRestart.bind(this));

    let url = `http${options.ssl ? 's' : ''}://${this.displayHost(tlroptions.host)}:${tlroptions.port}`;
    // Start LiveReload server
    return this.listen(tlroptions)
      .then(this.writeBanner.bind(this, url))
      .catch(this.writeErrorBanner.bind(this, url));
  }

  displayHost(specifiedHost) {
    return specifiedHost || 'localhost';
  }

  writeBanner(url) {
    this.ui.writeLine(`Livereload server on ${url}`);
  }

  writeErrorBanner(url) {
    throw new SilentError(`Livereload failed on ${url}.  It is either in use or you do not have permission.`);
  }

  writeSkipBanner(filePath) {
    this.ui.writeLine(`Skipping livereload for: ${filePath}`);
  }

  getDirectoryEntries(directory) {
    return walkSync.entries(directory);
  }

  shouldTriggerReload(options) {
    let result = true;

    if (this.project.liveReloadFilterPatterns.length > 0) {
      let filePath = path.relative(this.project.root, options.filePath || '');

      result = this.project.liveReloadFilterPatterns
        .every(pattern => pattern.test(filePath) === false);

      if (result === false) {
        this.writeSkipBanner(filePath);
      }
    }

    return result;
  }

  didChange(results) {
    let previousTree = this.tree;
    let files;

    if (results.stack) {
      this._hasCompileError = true;
      files = ['LiveReload due to compile error'];
    } else if (this._hasCompileError) {
      this._hasCompileError = false;
      files = ['LiveReload due to resolved compile error'];
    } else if (results.directory) {
      this.tree = new FSTree.fromEntries(this.getDirectoryEntries(results.directory), { sortAndExpand: true });
      files = previousTree.calculatePatch(this.tree)
        .filter(isNotRemoved)
        .filter(isNotDirectory)
        .map(relativePath)
        .filter(isNotSourceMapFile);

    } else {
      files = ['LiveReload files'];
    }

    logger.info('files %a', files);

    if (this.shouldTriggerReload(results)) {
      this.liveReloadServer().changed({
        body: {
          files,
        },
      });

      this.analytics.track({
        name: 'broccoli watcher',
        message: 'live-reload',
      });
    }
  }

  didRestart() {
    this.liveReloadServer().changed({
      body: {
        files: ['LiveReload files'],
      },
    });

    this.analytics.track({
      name: 'express server',
      message: 'live-reload',
    });
  }
}

module.exports = LiveReloadServerTask;
