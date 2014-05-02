'use strict';

var Command = require('../models/command');

module.exports = Command.extend({
  description: 'outputs ember-cli version',
  works: 'everywhere',

  aliases: ['v', 'version', '-v', '--version'],
  run: function() { }
});
