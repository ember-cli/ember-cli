'use strict';

var chain                   = require('connect-chain');
var broccoliMiddleware      = require('broccoli/lib/middleware');
var historySupportMiddlware = require('./history-support');
var cleanBaseURL            = require('../../../utilities/clean-base-url');

module.exports = function(options) {
  var middleware = chain(
    historySupportMiddlware(),
    broccoliMiddleware(options.watcher)
  );

  var baseURL = cleanBaseURL(options.baseURL);

  return function(req, res, next) {
    var oldURL = req.url;

    var actualPrefix   = req.url.slice(0, baseURL.length - 1); // Don't care
    var expectedPrefix = baseURL.slice(0, baseURL.length - 1); // about last slash

    if (actualPrefix === expectedPrefix) {
      req.url = req.url.slice(actualPrefix.length); // Remove baseURL prefix

      // Serve file, if no file has been found, reset url for proxy stuff
      // that comes afterwards
      middleware(req, res, function(err) {
        req.url = oldURL;
        next(err);
      });
    } else {
      next();
    }
  };
};
