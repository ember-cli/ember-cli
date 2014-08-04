'use strict';

var path = require('path');
var fs   = require('fs');

function HistorySupportAddon(project) {
  this.project = project;
  this.name = 'history-support-middleware';
}

HistorySupportAddon.prototype.serverMiddleware = function(config) {
  var app = config.app;
  var options = config.options;
  var watcher = options.watcher;

  app.use(function(req, res, next) {
    watcher.then(function(results) {
      var hasHTMLHeader = (req.headers.accept || []).indexOf('text/html') === 0;
      var isAsset = fs.existsSync(path.join(results.directory, req.path));
      var isForTests = /^\/tests/.test(req.path);

      if (req.method === 'GET' && hasHTMLHeader && !isAsset) {
        req.url = isForTests ? '/tests/index.html' : '/index.html';
      }

      next();
    });
  });
};

module.exports = HistorySupportAddon;
