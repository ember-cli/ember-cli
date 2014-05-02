'use strict';

var loom    = require('loom');
var Command = require('../models/command');

module.exports = Command.extend({
  works: 'insideProject',
  description: 'See http://git.io/1zCQ2A for available generators.',

  name: 'generate',
  aliases: ['g'],

  run: function(commandOptions, rawArgs) {
    loom(rawArgs.join(' '));
  },

  usageInstructions: function() {
    return {
      anonymousOptions: '<generator-name> <options...>'
    };
  }
});
