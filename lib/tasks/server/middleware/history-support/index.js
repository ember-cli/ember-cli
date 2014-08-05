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
  var testsRegexp = new RegExp('^' + baseURL + 'tests');
  var baseURLRegexp = new RegExp('^' + baseURL);
  var locationType = this.project.config(options.environment).locationType;

  if (['auto', 'history'].indexOf(locationType) !== -1) {
    app.use(function(req, res, next) {
      watcher.then(function(results) {
        var hasHTMLHeader = (req.headers.accept || []).indexOf('text/html') === 0;
        var assetPath = req.path.slice(baseURL.length);
        var isAsset = fs.existsSync(path.join(results.directory, assetPath));
        var isForTests = testsRegexp.test(req.path);
        var isForBaseURL = baseURLRegexp.test(req.path);

        if (req.method === 'GET' && hasHTMLHeader && isForBaseURL && !isAsset) {
          req.url = isForTests ? baseURL + 'tests/index.html' : baseURL + 'index.html';
        }

        next();
      });
    });
  }
};

module.exports = HistorySupportAddon;
