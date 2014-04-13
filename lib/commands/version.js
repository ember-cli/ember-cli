'use strict';

var chalk   = require('chalk');
var Command = require('../command');

module.exports = new Command({
  description: 'outputs ember-cli version',
  works: 'everywhere',

  aliases: ['v', 'version', '-v', '--version'],

  run: function() { }
});
