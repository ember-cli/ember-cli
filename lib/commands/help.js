'use strict';

var Command = require('../command');
var chalk = require('chalk');

module.exports = new Command({
  works: 'everywhere',
  aliases: [undefined, 'h', 'help', '-h', '--help'],

  run: function(environment) {
    var commands = environment.commands;
    var ui = environment.ui;

    function displayHelpForCommand(command) {
      var action = commands[command];

      // If the requested command doesn't exist, display an error message.
      if (!action) {
        ui.write(chalk.red('    No help entry for \'' + command + '\'\n'));
      } else {
        ui.write('    ' + action.usageInstructions() + '\n');
      }
    }

    // If any additional args were passed to the help command, attempt to look
    // up the command for each of them.
    if (environment.cliArgs.length > 1) {

      ui.write('Requested ember-cli commands:\n');

      // Iterate through each arg beyond the initial 'help' command, and try to
      // display usage instructions.
      environment.cliArgs.slice(1).forEach(displayHelpForCommand);

    // Otherwise, display usage for all commands.
    } else {
      ui.write('Available commands in ember-cli:\n');

      for (var key in commands){
        if (commands.hasOwnProperty(key)) {
          displayHelpForCommand(key);
        }
      }
    }
  },

  usageInstructions: function() {
    return 'ember help [<command-name>]';
  }
});
