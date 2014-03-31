'use strict';

var Promise = require('rsvp').Promise;
var liveReloadServer = require('./livereload-server');
var expressServer = require('./express-server');

function createForeverPromise() {
  return new Promise(function() {}); // Never call resolve()
}

module.exports.serve = function(options) {
  return Promise.all([
      liveReloadServer.start(options),
      expressServer.start(options)
    ])
    .then(createForeverPromise); // Run forever
};
