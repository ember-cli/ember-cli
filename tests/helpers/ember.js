'use strict';

var Cli = require('../../lib/cli');

var baseArgs = ['node', 'path/to/cli'];
var MockUi = require('./mock-ui');

module.exports = function ember(args) {
  var argv;

  if (args) {
    argv = baseArgs.slice().concat(args);
  } else {
    argv = baseArgs;
  }

  return Cli.run(argv, module.exports.ui);
};

module.exports.ui = new MockUi();
