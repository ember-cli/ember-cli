'use strict';

var Cli = require('../../lib/cli');

var baseArgs = ['node', 'path/to/cli'];
var MockUI = require('./mock-ui');

module.exports = function ember(args) {
  var argv;

  if (args) {
    argv = baseArgs.slice().concat(args);
  } else {
    argv = baseArgs;
  }

  var ui = module.exports.ui = new MockUI();
  return Cli.run(argv, ui);
};
