'use strict';

var Cli = require('../../lib/cli');

var baseArgs = ['node', 'path/to/cli'];

module.exports = function ember(args) {
  var argv;

  if (args) {
    argv = baseArgs.slice().concat(args);
  } else {
    argv = baseArgs;
  }

  return Cli.run(argv);
};
