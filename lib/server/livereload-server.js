'use strict';

var RSVP = require('rsvp');
var tinylr = require('tiny-lr');
var chalk = require('chalk');
var ui = require('../ui');

exports.start = function(options) {
  var liveReloadServer = new tinylr.Server();

  var listen = RSVP.denodeify(liveReloadServer.listen.bind(liveReloadServer));

  // Reload on file changes
  options.watcher.on('change', function() {
    liveReloadServer.changed({body: {files: ['LiveReload files']}});
  }).on('error', function(error) {
    console.log(chalk.red(error.message), error.stack);
  });

  // Start LiveReload server
  return listen(options.liveReloadPort)
    .then(function(value) {
      ui.write('Livereload server on port ' + options.liveReloadPort + '\n');
      return value;
    });
};
