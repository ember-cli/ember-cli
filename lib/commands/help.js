'use strict';

var Command       = require('../models/command');
var lookupCommand = require('../cli/lookup-command');
var string        = require('../utilities/string');
var assign        = require('lodash-node/modern/objects/assign');

var RootCommand = Command.extend({
  isRoot: true,
  name: 'ember',

  availableOptions: [],

  anonymousOptions: [
    '<command (Default: help)>'
  ]
});

module.exports = Command.extend({
  name: 'help',
  works: 'everywhere',
  description: 'Outputs the usage instructions for all commands or the provided command',
  aliases: [undefined, 'h', 'help', '-h', '--help'],

  availableOptions: [
    { name: 'verbose', type: Boolean, default: false, aliases: ['v'] }
  ],

  anonymousOptions: [
    '<command-name (Default: all)>'
  ],

  run: function(commandOptions, rawArgs) {
    if (rawArgs.length === 0) {
      var rootCommand = new RootCommand({
        ui: this.ui,
        project: this.project,
        commands: this.commands,
        tasks: this.tasks
      });
      rootCommand.printBasicHelp(commandOptions);
      // Display usage for all commands.
      this.ui.writeLine('Available commands in ember-cli:');
      this.ui.writeLine('');

      Object.keys(this.commands).forEach(function(commandName) {
        this._printBasicHelpForCommand(commandName, commandOptions);
      }.bind(this));

      if (this.project.eachAddonCommand) {
        this.project.eachAddonCommand(function(addonName, commands){
          this.commands = commands;
          this.ui.writeLine('\nAvailable commands from ' + addonName + ':');
          Object.keys(this.commands).forEach(function(commandName) {
            this._printBasicHelpForCommand(commandName, commandOptions);
          }.bind(this));
        }.bind(this));
      }

    } else {
      // If args were passed to the help command,
      // attempt to look up the command for each of them.
      this.ui.writeLine('Requested ember-cli commands:');
      this.ui.writeLine('');

      if (this.project.eachAddonCommand) {
        this.project.eachAddonCommand(function(addonName, commands){
          assign(this.commands, commands);
        }.bind(this));
      }

      // Iterate through each arg beyond the initial 'help' command,
      // and try to display usage instructions.
      rawArgs.forEach(function(commandName) {
        this._printDetailedHelpForCommand(commandName, commandOptions);
      }.bind(this));
    }
  },

  _printBasicHelpForCommand: function(commandName, options) {
    this._printHelpForCommand(commandName, false, options);
  },

  _printDetailedHelpForCommand: function(commandName, options) {
    this._printHelpForCommand(commandName, true, options);
  },

  _printHelpForCommand: function(commandName, detailed, options) {
    var command = this._lookupCommand(commandName);

    command.printBasicHelp(options);

    if (detailed) {
      command.printDetailedHelp(options);
    }
  },

  _lookupCommand: function(commandName) {
    var Command = this.commands[string.classify(commandName)] ||
                  lookupCommand(this.commands, commandName);

    return new Command({
      ui: this.ui,
      project: this.project,
      commands: this.commands,
      tasks: this.tasks
    });
  }
});
