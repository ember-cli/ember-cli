'use strict';

var cleanBaseURL = require('clean-base-url');
var existsSync = require('exists-sync');
var path = require('path');
var fs = require('fs');
var debug = require('debug')('ember-cli:serve-files');

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

      debug('isForTests: %o', isForTests);

      if (isForTests && (hasHTMLHeader || hasWildcardHeader) && req.method === 'GET') {
        var assetPath = req.path.slice(baseURL.length);
        var filePath = path.join(results.directory, assetPath);

        if (!existsSync(filePath) || !fs.statSync(filePath).isFile()) {
          var newURL = baseURL + '/tests/index.html';

          debug('url: %s resolved to path: %s which is not a file. Assuming %s instead', req.path, filePath, newURL);
          req.url = newURL;
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
