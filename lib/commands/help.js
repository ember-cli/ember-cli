'use strict';

var Command = require('../command');

module.exports = new Command({
  description: 'outputs this message',
  works: 'everywhere',

  aliases: [undefined, 'h', 'help', '-h', '--help'],

  run: function(ui, environment) {
    var commands = environment.commands;

    ui.write('available commands:\n');

    ui.write(Object.keys(commands).map(function(key) {
      return commands[key].usageInstructions();
    }).join('\n'));
  }
});
