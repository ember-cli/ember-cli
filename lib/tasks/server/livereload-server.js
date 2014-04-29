'use strict';

var Promise = require('../../ext/promise');
var tinylr  = require('tiny-lr');
var chalk   = require('chalk');

exports.start = function(options) {
  var liveReloadServer = new tinylr.Server();
  var leek             = this.leek;
  var ui               = this.ui;

  if (!options.liveReload) {
    return Promise.resolve('live-reload is disabled');
  }

  var listen = Promise.denodeify(liveReloadServer.listen.bind(liveReloadServer));

  // Reload on file changes
  options.watcher.on('change', function() {
    liveReloadServer.changed({body: {files: ['LiveReload files']}});
    leek.track({
      name:    'broccoli watcher',
      message: 'live-reload'
    });
  }).on('error', function(error) {
    console.log(chalk.red(error.message), error.stack);
    leek.trackError({
      description: error.message + ' ' + error.stack,
      isFatal:     false
    });
  });

  // Start LiveReload server
  return listen(options.liveReloadPort)
    .then(function() {
      ui.write('Livereload server on port ' + options.liveReloadPort + '\n');
    });
};
