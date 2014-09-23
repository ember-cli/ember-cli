'use strict';

var cleanBaseURL = require('../../../../utilities/clean-base-url');

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
  var baseURLRegexp = new RegExp('^' + baseURL);

  app.use(function(req, res, next) {
    watcher.then(function() {

      var acceptHeaders = req.headers.accept || [];
      var hasHTMLHeader = acceptHeaders.indexOf('text/html') !== -1;
      var hasWildcardHeader = acceptHeaders.indexOf('*/*') !== -1;

      var isForTests = testsRegexp.test(req.path);

      if (isForTests && (hasHTMLHeader || hasWildcardHeader) && req.method === 'GET') {
        if (baseURLRegexp.test(req.path)) {
          req.url = baseURL + 'tests/index.html';
        } else {
          req.url = '/tests/index.html';
        }
      }

      next();
    });
  });
};

module.exports = TestsServerAddon;
