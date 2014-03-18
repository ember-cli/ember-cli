'use strict';

var path = require('path');

module.exports = function () {

  return function(req, res, next) {

    function wantsHtml(accepts) {
      return path.extname(req.url) === '' && accepts && accepts.indexOf('text/html') === 0;
    }

    if(req.method === 'GET' && wantsHtml(req.headers.accept)) {
      req.url = '/index.html';
    }

    next();

  };
};
