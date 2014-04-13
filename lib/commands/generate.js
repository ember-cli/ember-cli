'use strict';

var loom    = require('loom');
var Command = require('../command');

module.exports = new Command({
  works: 'insideProject',
  description: 'See http://git.io/1zCQ2A for available generators.',

  aliases: ['g'],

  run: function(ui, environment) {
    loom(environment.cliArgs.join(' '));
  },

  usageInstructions: function() {
    return {
      anonymousOptions: '<generator-name> <options...>'
    };
  }
});
