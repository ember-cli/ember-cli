'use strict';

var path = require('path');
var fs   = require('fs');

var cleanBaseURL = require('../../../../utilities/clean-base-url');

function HistorySupportAddon(project) {
  this.project = project;
  this.name = 'history-support-middleware';
}

HistorySupportAddon.prototype.serverMiddleware = function(config) {
  var app = config.app;
  var options = config.options;
  var watcher = options.watcher;

  var baseURL = cleanBaseURL(options.baseURL);
  var baseURLRegexp = new RegExp('^' + baseURL);
  var locationType = this.project.config(options.environment).locationType;

  if (['auto', 'history'].indexOf(locationType) !== -1) {
    app.use(function(req, res, next) {
      watcher.then(function(results) {

        var acceptHeaders = req.headers.accept || [];
        var hasHTMLHeader = acceptHeaders.indexOf('text/html') !== -1;
        var isForBaseURL = baseURLRegexp.test(req.path);

        if (hasHTMLHeader && isForBaseURL && req.method === 'GET') {
          var assetPath = req.path.slice(baseURL.length);
          if (!fs.existsSync(path.join(results.directory, assetPath))) {
            req.url = baseURL + 'index.html';
          }
        }

        next();
      });
    });
  }
};

module.exports = HistorySupportAddon;
