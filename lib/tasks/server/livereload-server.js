'use strict';

var RSVP = require('rsvp');
var tinylr = require('tiny-lr');
var chalk = require('chalk');

exports.start = function(ui, options) {
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
    .then(function() {
      ui.write('Livereload server on port ' + options.liveReloadPort + '\n');
    });
};
