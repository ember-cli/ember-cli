'use strict';

module.exports = function () {

  return function(req, res, next) { // Gotta catch 'em all (and serve index.html)

    function acceptsHtml(accepts) {
      if(!accepts) { return false; }
      if(accepts.indexOf('text/css') === 0) { return false; } // text/css;*.*
      if(accepts.indexOf('*/*') === 0) { return false; } // Can't determine accepted type, don't let it rewrite!
      return accepts.indexOf('text/html') !== -1 || accepts.indexOf('*/*') !== -1;
    }

    if(req.method === 'GET' && acceptsHtml(req.headers.accept)) {
      req.url = '/index.html';
    }

    next();

  };
};
