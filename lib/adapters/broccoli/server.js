'use strict';

var broccoli = require('broccoli');
var Promise = require('rsvp').Promise;
var Server = require('../../server');
var Watcher =  require('broccoli/lib/watcher');
var notifier = require('../../utilities/build-notifier');

function getBuilder () {
  var tree = broccoli.loadBrocfile();
  return new broccoli.Builder(tree);
}

module.exports = function server(options) {

  notifier.installInto(broccoli);

  var watcher = new Watcher(getBuilder());

  options.watcher = watcher;

  watcher.on('change', function(dir) {
    broccoli.notify(dir);
  });

  Server.serve(options);
  return new Promise(function(){ }); // runs for-ever
};
