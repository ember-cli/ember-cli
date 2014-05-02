'use strict';

var Promise = require('../../ext/promise');
var proxy   = require('proxy-middleware');
var url     = require('url');
var chain   = require('connect-chain');

// Middleware
var historySupport = require('./middleware/history-support');
var brocware       = require('broccoli/lib/middleware');

exports.start = function(options) {
  var ui         = this.ui;
  var middleware = chain(historySupport(), brocware(options.watcher));

  if (options.proxyPort && options.proxyHost) {
    var urlopts = {
      pathname: '',
      hostname: options.proxyHost,
      port: options.proxyPort
    };

    ui.write('Proxying to ' + url.format(urlopts) + ' on port ' + options.proxyPort + '\n');
    middleware = chain(middleware, proxy(urlopts));
  }

  var server = require(this.project.root + '/server')(middleware);
  var listen = Promise.denodeify(server.listen.bind(server));

  return listen(options.port, options.host)
    .then(function() {
      ui.write('Serving on http://' + options.host + ':' + options.port + '\n');
    });
};
