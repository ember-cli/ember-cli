'use strict';

var loadBrocfile     = require('../utilities/load-brocfile');
var broccoli         = require('broccoli');

var signalsTrapped = false;

module.exports = function buildBuilder() {
  var tree    = loadBrocfile();
  var builder = new broccoli.Builder(tree);

  process.addListener('exit', function () {
    builder.cleanup();
  });

  if (!signalsTrapped) {
    // We register these so the 'exit' handler removing temp dirs is called
    process.on('SIGINT', function () {
      process.exit(1);
    });

    process.on('SIGTERM', function () {
      process.exit(1);
    });

    signalsTrapped = true;
  }

  return builder;
};
