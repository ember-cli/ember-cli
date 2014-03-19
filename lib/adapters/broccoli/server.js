'use strict';

var broccoli = require('broccoli');
var Promise = require('rsvp').Promise;
var Server = require('../../server');
var builder = require('./builder');
var Watcher =  require('../../../node_modules/broccoli/lib/watcher');

module.exports = function server(options) {
  var watcher = new Watcher(builder(broccoli, options.appRoot));

  options.watcher = watcher;

  Server.serve(options);
  return new Promise(function(){ }); // runs for-ever
};
