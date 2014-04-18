'use strict';

var loom    = require('loom');
var Command = require('../command');

module.exports = new Command({
  works: 'insideProject',
  description: 'See http://git.io/1zCQ2A for available generators.',

  aliases: ['g'],

  run: function(environment) {
    loom(environment.cliArgs.slice(1).join(' '));
  },

  usageInstructions: function() {
    return {
      anonymousOptions: '<generator-name> <options...>'
    };
  }
});
