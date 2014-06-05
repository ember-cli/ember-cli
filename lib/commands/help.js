'use strict';

var Command = require('../models/command');
var lookupCommand = require('../cli/lookup-command');
var string = require('../utilities/string');

module.exports = Command.extend({
  name: 'help',
  works: 'everywhere',
  description: 'Outputs the usage instructions for all commands or the provided command',

  aliases: [undefined, 'h', 'help', '-h', '--help'],

  _displayHelpForCommand: function(commandName) {
    var Command = this.commands[string.classify(commandName)] || lookupCommand(this.commands, commandName);

    new Command({
      ui: this.ui,
      project: this.project,
      commands: this.commands
    }).printUsageInstructions();
  },

  run: function(commandOptions, rawArgs) {
    if (rawArgs.length === 0) {
      // Display usage for all commands.
      this.ui.write('Available commands in ember-cli:\n');

      Object.keys(this.commands).forEach(this._displayHelpForCommand.bind(this));
    } else {
      // If args were passed to the help command,
      // attempt to look up the command for each of them.
      this.ui.write('Requested ember-cli commands:\n\n');

      // Iterate through each arg beyond the initial 'help' command,
      // and try to display usage instructions.
      rawArgs.forEach(this._displayHelpForCommand.bind(this));
    }
  },

  usageInstructions: function() {
    return {
      anonymousOptions: '<command-name (Default: all)>'
    };
  }
});
