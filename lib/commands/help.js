'use strict';

var Command = require('../command');

module.exports = new Command({
  works: 'everywhere',

  aliases: [undefined, 'h', 'help', '-h', '--help'],

  run: function(ui, environment) {
    console.log('hi');
    var commands = environment.commands;

    ui.write('Available commands in ember-cli:\n');

    for (var key in commands){
      if (commands.hasOwnProperty(key)) {
        ui.write('  ' + commands[key].usageInstructions() + '\n');
      }
    }
  },

  usageInstructions: function() {
    return 'ember help';
  }
});
