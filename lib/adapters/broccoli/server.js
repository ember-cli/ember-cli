'use strict';

var broccoli = require('broccoli');
var Promise = require('rsvp').Promise;

function getBuilder () {
  var tree = broccoli.loadBrocfile();
  return new broccoli.Builder(tree);
}

module.exports = function server(options) {
  broccoli.server.serve(getBuilder(), options);
  return new Promise(function(){ }); // runs for-ever
};
