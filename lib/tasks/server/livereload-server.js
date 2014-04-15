'use strict';

var Promise = require('../../ext/promise');
var tinylr = require('tiny-lr');
var chalk = require('chalk');
var Leek  = require('Leek');
var leek = new Leek({
  trackingCode: 'UA-49225444-1',
  name: 'ember-cli',
  version: '0.0.23'
});

exports.start = function(ui, options) {
  var liveReloadServer = new tinylr.Server();

  var listen = Promise.denodeify(liveReloadServer.listen.bind(liveReloadServer));

  // Reload on file changes
  options.watcher.on('change', function() {
    leek.track('broccoli rebuild', options.environment);
    liveReloadServer.changed({body: {files: ['LiveReload files']}});
  }).on('error', function(error) {
    console.log(chalk.red(error.message), error.stack);
  });

  // Start LiveReload server
  return listen(options.liveReloadPort)
    .then(function() {
      ui.write('Livereload server on port ' + options.liveReloadPort + '\n');
    });
};
