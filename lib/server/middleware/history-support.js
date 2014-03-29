'use strict';

var path = require('path');
var url = require('url');

module.exports = function () {
  return function(req, res, next) {
    var hasHTMLHeader = (req.headers.accept || []).indexOf('text/html') === 0;
    var hasNoFileExtension = path.extname(url.parse(req.url).pathname) === '';
    var isForTests = /^\/tests/.test(req.path);

    if(req.method === 'GET' && hasHTMLHeader && hasNoFileExtension) {
      req.url = isForTests ? '/tests/index.html' : '/index.html';
    }

    next();
  };
};
