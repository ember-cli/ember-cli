'use strict';

var RSVP = require('rsvp');
var express = require('express');
var ui = require('../ui');

// Middleware
var historySupport = require('./middleware/history-support');
var tests = require('./middleware/tests');
var brocware = require('broccoli/lib/middleware');
var livereload = require('connect-livereload');


exports.start = function(options) {
  var server = express()
    .use(livereload({ port: options.liveReloadPort })) // ToDo: Script injection doesn't work, yet
    .use(tests())
    .use(historySupport())
    .use(brocware(options.watcher));

  var listen = RSVP.denodeify(server.listen.bind(server));

  return listen(options.port, options.host)
    .then(function(value) {
      ui.write('Serving on http://' + options.host + ':' + options.port + '\n');
      return value;
    });
};
