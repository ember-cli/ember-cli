'use strict';

var path          = require('path');
var merge         = require('lodash-node/modern/objects/merge');
var ServerWatcher = require('../../../../models/server-watcher');

function MockServerAddon(project) {
  this.project = project;
  this.name = 'mock-server-middleware';
}

/**
 * Root directory where Mock Server middleware is defined
 * @type {String|null}
 */
MockServerAddon.prototype.root = null;

/**
 * Instance of ServerWatcher that's watching root
 * @type {ServerWatcher|null}
 */
MockServerAddon.prototype.watcher = null;

MockServerAddon.prototype.serverMiddleware = function serverMiddleware(params) {
  var app = params.app;
  var options = params.options;
  var expressServer = params.expressServer;

  var root = this.root = options.serverRoot;
  var ui = options.watcher.ui;
  var analytics = options.watcher.analytics;

  if (!this.project.has(root)) {
    return;
  }

  if (this.watcher == null) {
    var watcher = this.watcher = new ServerWatcher({
      ui: ui,
      analytics: analytics,
      watchedDir: path.resolve(root)
    });

    var scheduleServerRestart = expressServer.scheduleServerRestart.bind(expressServer);
    watcher.on('change',  scheduleServerRestart);
    watcher.on('add',     scheduleServerRestart);
    watcher.on('delete',  scheduleServerRestart);

    expressServer.on('stop', this.invalidateCache.bind(this));
  }

  var server = this.loadServer();
  server(app, options);
};

MockServerAddon.prototype.testemMiddleware = function testemMiddleware(params) {
  var options = params.options;
  var root = this.root = options.serverRoot;

  if (this.project.has(root)) {
    var server = this.loadServer();
    return server;
  }
};

MockServerAddon.prototype.loadServer = function loadServer() {
  var server = this.project.require(this.root);
  if (typeof server !== 'function') {
    throw new TypeError('ember-cli expected ./server/index.js to be the entry for your mock or proxy server');
  }
  return server;
};

MockServerAddon.prototype.invalidateCache = function invalidateCache() {
  var absoluteServerRoot = path.resolve(this.root);
  if (absoluteServerRoot[absoluteServerRoot.length - 1] !== path.sep) {
    absoluteServerRoot = path.sep;
  }

  var allKeys = Object.keys(require.cache);
  for (var i = 0; i < allKeys.length; i++) {
    if (allKeys[i].indexOf(absoluteServerRoot) === 0) {
      delete require.cache[allKeys[i]];
    }
  }
};

module.exports = MockServerAddon;
