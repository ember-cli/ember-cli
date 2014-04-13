'use strict';

var Command = require('../command');

module.exports = new Command({
  works: 'everywhere',

  aliases: ['v', 'version', '-v', '--version'],

  run: function(environment) {
    environment.ui.write('ember-cli ' + require('../../package.json').version + '\n');
  },

  usageInstructions: function() {
    return 'ember --version';
  }
});
