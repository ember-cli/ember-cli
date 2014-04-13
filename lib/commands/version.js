'use strict';

var chalk   = require('chalk');
var Command = require('../command');

module.exports = new Command({
  works: 'everywhere',

  aliases: ['v', 'version', '-v', '--version'],

  run: function(ui) {
    ui.write('ember-cli ' + require('../../package.json').version + '\n');
  },

  usageInstructions: function() {
    return chalk.green('ember version\n');
  }
});
