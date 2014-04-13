'use strict';

var chalk   = require('chalk');
var loom    = require('loom');
var Command = require('../command');

module.exports = new Command({
  works: 'insideProject',

  aliases: ['g'],

  run: function(environment) {
    loom(environment.cliArgs.join(' '));
  },

  usageInstructions: function() {
    return 'ember generate ' +
      chalk.yellow('<generator-name>') + ' <options...> ' +
      chalk.green('See http://git.io/1zCQ2A for available generators');
  }
});
