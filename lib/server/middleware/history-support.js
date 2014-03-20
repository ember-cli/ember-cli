'use strict';

var path = require('path');

module.exports = function () {
  return function(req, res, next) {
    var hasHTMLHeader = (req.headers.accept || []).indexOf('text/html') === 0;
    var hasNoFileExtension = path.extname(req.url) === '';

    if(req.method === 'GET' && hasHTMLHeader && hasNoFileExtension) {
      req.url = '/index.html';
    }

    next();
  };
};
