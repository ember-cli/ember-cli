'use strict';

var lookupCommand   = require('../cli/lookup-command');
var stringUtils     = require('ember-cli-string-utils');
var RootCommand     = require('./root-command');
var versionUtils    = require('./version-utils');
var emberCLIVersion = versionUtils.emberCLIVersion;

function JsonGenerator(options) {
  options = options || {};

  this.ui = options.ui;
  this.project = options.project;
  this.commands = options.commands;
  this.tasks = options.tasks;
}

JsonGenerator.prototype.generate = function(commandOptions) {
  var rootCommand = new RootCommand({
    ui: this.ui,
    project: this.project,
    commands: this.commands,
    tasks: this.tasks
  });

  var json = rootCommand.getJson(commandOptions);
  json.version = emberCLIVersion();
  json.commands = [];
  json.addons = [];

  Object.keys(this.commands).forEach(function(commandName) {
    this._addCommandHelpToJson(commandName, commandOptions, json);
  }, this);

  if (this.project.eachAddonCommand) {
    this.project.eachAddonCommand(function(addonName, commands) {
      this.commands = commands;

      var addonJson = { name: addonName };
      addonJson.commands = [];
      json.addons.push(addonJson);

      Object.keys(this.commands).forEach(function(commandName) {
        this._addCommandHelpToJson(commandName, commandOptions, addonJson);
      }, this);
    }.bind(this));
  }

  return json;
};


JsonGenerator.prototype._addCommandHelpToJson = function(commandName, options, json) {
  var command = this._lookupCommand(commandName);
  if (!command.skipHelp && !command.unknown) {
    json.commands.push(command.getJson(options));
  }
};

JsonGenerator.prototype._lookupCommand = function(commandName) {
  var Command = this.commands[stringUtils.classify(commandName)] ||
    lookupCommand(this.commands, commandName);

  return new Command({
    ui: this.ui,
    project: this.project,
    commands: this.commands,
    tasks: this.tasks
  });
};

module.exports = JsonGenerator;
