'use strict';

var chalk = require('chalk');
var loom  = require('loom');

module.exports = {
  works: 'insideProject',

  run: function(environment) {
    console.log(environment.cliArgs);
    loom(environment.cliArgs.join(' '));
  },

  usageInstructions: function() {
    return 'ember generate ' +
      chalk.yellow('<generator-name>') + ' <options...> ' +
      chalk.green('See http://git.io/1zCQ2A for available generators');
  }
};
