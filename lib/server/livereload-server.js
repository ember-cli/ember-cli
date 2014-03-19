'use strict';

var RSVP = require('rsvp');
var tinylr = require('tiny-lr');

exports.start = function(options) {
  var liveReloadServer = new tinylr.Server();

  var listen = RSVP.denodeify(liveReloadServer.listen.bind(liveReloadServer));

  // Reload on file changes
  options.watcher.on('change', function() {
    console.log('built');
    liveReloadServer.changed({body: {files: ['LiveReload files']}});
  });

  // Start LiveReload server
  return listen(options.liveReloadPort)
    .then(function() {
      console.log('Livereload server on port ' + options.liveReloadPort);
    });
};