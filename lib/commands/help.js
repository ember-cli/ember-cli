'use strict';

var Command = require('../command');
var chalk = require('chalk');

module.exports = new Command({
  description: 'Outputs the usage instructions for all commands or the provided command',
  works: 'everywhere',

  aliases: [undefined, 'h', 'help', '-h', '--help'],

  run: function(ui, environment) {
    var commands = environment.commands;

    function displayHelpForCommand(commandName) {
      var command = commands[commandName];

      // If the requested command doesn't exist, display an error message.
      if (!command) {
        ui.write(chalk.red('No help entry for \'' + commandName + '\'\n'));
      } else {
        ui.write(command.usageInstructions() + '\n');
      }
    }

    // If any additional args were passed to the help command, attempt to look
    // up the command for each of them.
    var cliArgs = environment.cliArgs;
    if (cliArgs && cliArgs.length > 1) {

      ui.write('Requested ember-cli commands:\n\n');

      // Iterate through each arg beyond the initial 'help' command, and try to
      // display usage instructions.
      environment.cliArgs.slice(1).forEach(displayHelpForCommand);

    // Otherwise, display usage for all commands.
    } else {
      ui.write('Available commands in ember-cli:\n');

      Object.keys(commands).forEach(function(key) {
        displayHelpForCommand(key);
      });
    }
  },
  usageInstructions: function() {
    return {
      anonymousOptions: '<command-name (Default: all)>'
    };
  }
});
