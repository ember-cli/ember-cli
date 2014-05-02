'use strict';

var Promise = require('../../ext/promise');
var express = require('express');
var proxy   = require('proxy-middleware');
var url     = require('url');

// Middleware
var historySupport = require('./middleware/history-support');
var brocware = require('broccoli/lib/middleware');
var livereload = require('connect-livereload');

exports.start = function(options) {
  var ui     = this.ui;
  var server = express()
    .use(livereload({ port: options.liveReloadPort })) // ToDo: Script injection doesn't work, yet
    .use(historySupport())
    .use(brocware(options.watcher));

  if (options.proxyUrl) {
    var urlopts = url.parse(options.proxyUrl);

    ui.write('Proxying to ' + options.proxyUrl + '\n');
    server = server.use(proxy(urlopts));
  }

  var listen = Promise.denodeify(server.listen.bind(server));

  return listen(options.port, options.host)
    .then(function() {
      ui.write('Serving on http://' + options.host + ':' + options.port + '\n');
    });
};
