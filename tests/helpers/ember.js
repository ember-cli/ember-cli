'use strict';

var MockUI   = require('./mock-ui');
var MockLeek = require('./mock-leek');
var Cli      = require('../../lib/cli');

var baseArgs = ['node', 'path/to/cli'];

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
    cliArgs:      args,
    Leek: MockLeek,
    UI: MockUI,
    testing: true
  });

  return cli;
};
