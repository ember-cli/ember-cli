'use strict';

var Promise     = require('../../ext/promise');
var chalk       = require('chalk');
var path        = require('path');
var Task        = require('../../models/task');
var SilentError = require('../../errors/silent');

function createServer() {
  var instance;
  var Server = (require('tiny-lr')).Server;
  Server.prototype.error = function() {
    instance.error.apply(instance, arguments);
  };
  instance = new Server();
  return instance;
}

module.exports = Task.extend({
  init: function() {
    this.liveReloadServer = createServer();
  },

  listen: function(port) {
    var server = this.liveReloadServer;
    return new Promise(function(resolve, reject) {
      server.error = reject;
      server.listen(port, resolve);
    });
  },

  start: function(options) {
    // Reload on file changes
    this.watcher.on('change', this.didChange.bind(this));
    this.watcher.on('error',  this.didError.bind(this));

    // Start LiveReload server
    return this.listen(options.liveReloadPort)
      .then(this.writeBanner.bind(this, options.liveReload, options.liveReloadPort))
      .catch(this.writeErrorBanner.bind(this, options.liveReload, options.liveReloadPort));
  },

  writeBanner: function(print, port) {
    if (print) {
      this.ui.writeLine('Livereload server on port ' + port);
    }
  },

  writeErrorBanner: function(print, port) {
    if (print) {
      throw new SilentError('Livereload failed on port ' + port + '.  It is either in use or you do not have permission.');
    }
  },

  didChange: function(results) {
    var filePath = path.relative(this.project.root, results.filePath || '');

    var canTrigger = this.project.liveReloadFilterPatterns.reduce(function(bool, pattern) {
      bool = bool && !filePath.match(pattern);
      return bool;
    }, true);

    if (canTrigger) {
      this.liveReloadServer.changed({
        body: {
          files: ['LiveReload files']
        }
      });

      this.analytics.track({
        name:    'broccoli watcher',
        message: 'live-reload'
      });
    }
  },

  didError: function(error) {
    this.ui.writeLine(chalk.red(error.message));
    this.ui.writeLine(error.stack);

    this.analytics.trackError({
      description: error.message + ' ' + error.stack,
      isFatal:     false
    });
  }
});
