'use strict';

const SilentError = require('silent-error');
const walkSync = require('walk-sync');
const path = require('path');
const FSTree = require('fs-tree-diff');
const logger = require('heimdalljs-logger')('ember-cli:live-reload:');
const fs = require('fs');

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
module.exports = class LiveReloadServer {

  constructor({ app, watcher, ui, project, analytics, httpServer, port, prefix }) {
    this.app = app;
    this.watcher = watcher;
    this.ui = ui;
    this.project = project;
    this.analytics = analytics;
    this.httpServer = httpServer;
    this.port = port;
    this.liveReloadPrefix = prefix;
  }

  createHttpsServer(options, Server) {
    if (!fs.existsSync(options.sslKey)) {
      throw new TypeError(`SSL key couldn't be found in "${options.sslKey}", ` +
        `please provide a path to an existing ssl key file with --ssl-key`);
    }

    if (!fs.existsSync(options.sslCert)) {
      throw new TypeError(`SSL certificate couldn't be found in "${options.sslCert}", ` +
        `please provide a path to an existing ssl certificate file with --ssl-cert`);
    }

    let key = fs.readFileSync(options.sslKey);
    let cert = fs.readFileSync(options.sslCert);

    return new Server({
      app: this.app,
      dashboard: 'false',
      prefix: this.liveReloadPrefix,
      port: this.port,
      key,
      cert,
    });
  }

  getMiddleware(options) {
    const tinylr = require('tiny-lr');
    const Server = tinylr.Server;
    if (options.liveReload) {
      if (options.ssl) {
        this.liveReloadServer = this.createHttpsServer(options, Server);
      } else {
        this.liveReloadServer = new Server({
          app: this.app,
          dashboard: 'false',
          prefix: this.liveReloadPrefix,
          port: this.port,
        });
      }
      this.httpServer.on('upgrade', this.liveReloadServer.websocketify.bind(this.liveReloadServer));
      this.httpServer.on('error', this.liveReloadServer.error.bind(this.liveReloadServer));
      this.httpServer.on('close', this.liveReloadServer.close.bind(this.liveReloadServer));
      this.start();
      return this.liveReloadServer.handler.bind(this.liveReloadServer);
    } else {
      this.ui.writeWarnLine('Livereload server manually disabled.');
    }
  }

  start() {
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
    this.app.on('restart', this.didRestart.bind(this));
  }

  displayHost(specifiedHost) {
    return specifiedHost || 'localhost';
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
      this.liveReloadServer.changed({
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
    this.liveReloadServer.changed({
      body: {
        files: ['LiveReload files'],
      },
    });

    this.analytics.track({
      name: 'express server',
      message: 'live-reload',
    });
  }
};
