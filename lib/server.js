var express = require('express');
var historySupport = require('./middleware/history-support');
var brocware = require('broccoli/lib/middleware');
var Promise = require('rsvp').Promise;

module.exports.serve = function(options) {
  return new Promise(function(resolve, reject) {
    express()
      .use(historySupport(options))
      .use(brocware(options.watcher))
      .listen(options.port, options.host, function(err) {
        if (err) {
          return reject('Could not start server.');
        } else {
          console.log('Serving on http://' + options.host + ':' + options.port);
        }
      });
  });
};
