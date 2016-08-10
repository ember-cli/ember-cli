'use strict';

var Promise     = require('../../ext/promise');
var fs          = require('fs');
var Task        = require('../../models/task');
var SilentError = require('silent-error');
var walkSync    = require('walk-sync');
var path        = require('path');
var FSTree      = require('fs-tree-diff');
var logger      = require('heimdalljs-logger')('ember-cli:live-reload:');

function createServer(options) {
  var instance;

  var Server = (require('tiny-lr')).Server;
  Server.prototype.error = function() {
    instance.error.apply(instance, arguments);
  };
  instance = new Server(options);
  return instance;
}

function isNotRemoved(entryTuple) {
  var operation = entryTuple[0];
  return operation !== 'unlink' && operation !== 'rmdir';
}

function isNotDirectory(entryTuple) {
  var entry = entryTuple[2];
  return entry && !entry.isDirectory();
}

function relativePath(patch) {
  return patch[1];
}

function isNotSourceMapFile(file) {
  return !(/\.map$/.test(file));
}

module.exports = Task.extend({
  liveReloadServer: function(options) {
    if (this._liveReloadServer) {
      return this._liveReloadServer;
    }

    this._liveReloadServer = createServer(options);
    return this._liveReloadServer;
  },

  listen: function(options) {
    var server = this.liveReloadServer(options);

    return new Promise(function(resolve, reject) {
      server.error = reject;
      server.listen(options.port, options.host, resolve);
    });
  },

  start: function(options) {
    var tlroptions = {};

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

    var url = 'http' + (options.ssl ? 's' : '') +
      '://' + this.displayHost(tlroptions.host) + ':' + tlroptions.port;
    // Start LiveReload server
    return this.listen(tlroptions)
      .then(this.writeBanner.bind(this, url))
      .catch(this.writeErrorBanner.bind(this, url));
  },

  displayHost: function(specifiedHost) {
    return specifiedHost || 'localhost';
  },

  writeBanner: function(url) {
    this.ui.writeLine('Livereload server on ' + url);
  },

  writeErrorBanner: function(url) {
    throw new SilentError('Livereload failed on ' + url +
                          '.  It is either in use or you do not have permission.');
  },

  writeSkipBanner: function(filePath) {
    this.ui.writeLine('Skipping livereload for: ' + filePath);
  },

  getDirectoryEntries: function(directory) {
    return walkSync.entries(directory);
  },

  shouldTriggerReload: function(options) {
    var result = true;

    if (this.project.liveReloadFilterPatterns.length > 0) {
      var filePath = path.relative(this.project.root, options.filePath || '');

      result = this.project.liveReloadFilterPatterns.every(function(pattern) {
        return pattern.test(filePath) === false;
      });

      if (result === false) {
        this.writeSkipBanner(filePath);
      }
    }

    return result;
  },

  didChange: function(results) {
    var previousTree = this.tree;
    var files;

    if (results.directory) {
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
          files: files
        }
      });

      this.analytics.track({
        name:    'broccoli watcher',
        message: 'live-reload'
      });
    }
  },

  didRestart: function() {
    this.liveReloadServer().changed({
      body: {
        files: ['LiveReload files']
      }
    });

    this.analytics.track({
      name:    'express server',
      message: 'live-reload'
    });
  }
});
