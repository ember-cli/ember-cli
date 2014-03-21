'use strict';

var broccoli = require('broccoli');
var Promise = require('rsvp').Promise;
var Server = require('../../server');
var Watcher =  require('broccoli/lib/watcher');

function getBuilder () {
  var tree = broccoli.loadBrocfile();
  return new broccoli.Builder(tree);
}

module.exports = function server(options) {
  var watcher = new Watcher(getBuilder());

  options.watcher = watcher;

  Server.serve(options);
  return new Promise(function(){ }); // runs for-ever
};
