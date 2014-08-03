'use strict';

// Used in serve-files middleware

var path = require('path');
var fs   = require('fs');

module.exports = function(watcher) {
  return function(req, res, next) {
    watcher.then(function(results) {
      var hasHTMLHeader = (req.headers.accept || []).indexOf('text/html') === 0;
      var isAsset = fs.existsSync(path.join(results.directory, req.path));
      var isForTests = /^\/tests/.test(req.path);

      if (req.method === 'GET' && hasHTMLHeader && !isAsset) {
        req.url = isForTests ? '/tests/index.html' : '/index.html';
      }

      next();
    });
  };
};
