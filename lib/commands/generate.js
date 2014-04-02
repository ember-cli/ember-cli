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
      chalk.green('See https://github.com/cavneb/loom-generators-ember-appkit for available generators');
  }
};
