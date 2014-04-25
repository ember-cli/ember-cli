'use strict';

var rewire   = require('rewire');
var Cli      = rewire('../../lib/cli');
var baseArgs = ['node', 'path/to/cli'];

Cli.__set__('UI', function() {
  this.outputStream = [];
  this.inputStream  = [];

  this.write = function(data) {
    this.outputStream.push(data);
  };
});

Cli.__set__('Leek', function() {
  return {
    track:      function() {},
    trackEvent: function() {},
    trackError: function() {}
  };
});

module.exports = function ember(args) {
  var argv, cli;

  if (args) {
    argv = baseArgs.slice().concat(args);
  } else {
    argv = baseArgs;
  }

  cli = new Cli({
    inputStream:  [],
    outputStream: [],
    cliArgs:      args
  });

  return cli;
};
