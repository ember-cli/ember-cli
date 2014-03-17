'use strict';

var express = require('express');
var middleware = require('./server/static');
var brocware = require('broccoli/lib/middleware');
var Promise = require('rsvp').Promise;

module.exports.serve = function(options) {
  var app = express();

  app.use(middleware(options));
  app.use(brocware(options.watcher));

  app.listen(options.port, options.host);

  console.log('Serving on http://' + options.host + ':' + options.port);

  return new Promise(function() { }); // runs forever
};
