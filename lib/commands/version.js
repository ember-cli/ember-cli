'use strict';

var Command = require('../command');

module.exports = new Command({
  description: 'outputs ember-cli version',
  works: 'everywhere',

  aliases: ['v', 'version', '-v', '--version'],

  run: function() { }
});
