'use strict';

function ProxyServerAddon(project) {
  this.project = project;
  this.name = 'proxy-server-middleware';
}

ProxyServerAddon.prototype.serverMiddleware = function(options) {
  var app = options.app;
  options = options.options;

  if (options.proxy) {
    options.ui.write('Using ember serve --proxy has been deprecated. To proxy requests to `/api` generate an http-proxy with: `ember generate http-proxy api ' + options.proxy + '`.\n');

    var urlOpts = require('url').parse(options.proxy);
    var proxy   = require('proxy-middleware');
    var morgan  = require('morgan');

    options.ui.write('Proxying to ' + options.proxy + '\n');

    app.use(morgan('dev'));
    app.use(proxy(urlOpts));
  }
};

module.exports = ProxyServerAddon;
