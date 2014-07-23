'use strict';

function ServeFilesAddon(project) {
  this.project = project;
  this.name = 'serve-files-middleware';
}

ServeFilesAddon.prototype.serverMiddleware = function(options) {
  var app = options.app;
  options = options.options;

  var serveFilesMiddleware = require('./serve-files');
  app.use(serveFilesMiddleware({
    watcher: options.watcher,
    baseURL: options.baseURL
  }));
};

module.exports = ServeFilesAddon;
