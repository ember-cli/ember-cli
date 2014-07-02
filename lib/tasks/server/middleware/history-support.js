'use strict';

// Used in serve-files middleware

var path = require('path');

module.exports = function() {
  return function(req, res, next) {
    var hasHTMLHeader = req.accepts('html') === 'html';
    var hasNoFileExtension = path.extname(req.path) === '';
    var isForTests = /^\/tests/.test(req.path);

    if (req.method === 'GET' && hasHTMLHeader && hasNoFileExtension) {
      req.url = isForTests ? '/tests/index.html' : '/index.html';
    }

    next();
  };
};
