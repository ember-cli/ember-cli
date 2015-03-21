'use strict';

var cleanBaseURL = require('../../../../utilities/clean-base-url');
var fs = require('fs');
var path = require('path');

function TestsServerAddon(project) {
  this.project = project;
  this.name = 'tests-server-middleware';
}

TestsServerAddon.prototype.serverMiddleware = function(config) {
  var app = config.app;
  var options = config.options;
  var watcher = options.watcher;

  var baseURL = cleanBaseURL(options.baseURL);
  var testsRegexp = new RegExp('^' + baseURL + 'tests');

  app.use(function(req, res, next) {
    watcher.then(function(results) {
      var acceptHeaders = req.headers.accept || [];
      var hasHTMLHeader = acceptHeaders.indexOf('text/html') !== -1;
      var hasWildcardHeader = acceptHeaders.indexOf('*/*') !== -1;

      var isForTests = testsRegexp.test(req.path);

      if (isForTests && (hasHTMLHeader || hasWildcardHeader) && req.method === 'GET') {
        var assetPath = req.path.slice(baseURL.length);
        var filePath = path.join(results.directory, assetPath);

        if(!fs.existsSync(filePath) || !fs.lstatSync(filePath).isFile()) {
          req.url = baseURL + '/tests/index.html';
        }
      }

    }).finally(next).finally(function() {
      if (config.finally) {
        config.finally();
      }
    });
  });
};

module.exports = TestsServerAddon;
