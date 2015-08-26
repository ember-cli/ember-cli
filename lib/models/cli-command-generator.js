'use strict';

var fs               = require('fs');
var path             = require('path');
var Project          = require('./project');
var omelette         = require('omelette');
var requireAsHash    = require('../utilities/require-as-hash');
var commands         = requireAsHash('../commands/*.js', Object);
var lookupCommand    = require('../cli/lookup-command');
var CliCommand       = require('./cli-command');

var uniq             = require('lodash/array/uniq');
var flatten          = require('lodash/array/flatten');
var Blueprint        = require('./blueprint');


/**
  CliCommandGenerator is responsible for generating a JSON of all available
  cli commands including options used by the CliCommandCompleter

  @class CliCommandGenerator
  @extends CoreObject
  @param  {Object} project Current project (optional).
  @constructor
*/

function CliCommandGenerator(project) {
  this.project = this.prepareProject(project);
  this.relPathToCache = '/node_modules/ember-cli/cli-commands.json';
  this.blueprints = loadBlueprints(this.project);
  this.commands = loadCommands(this.project);
  this.root = loadRoot();
  return this;
}

/**
  Writes cached cli command JSON into a file

  @private
  @method run
 */

CliCommandGenerator.prototype.run = function() {
  var pathToCache = this.project.root + this.relPathToCache;
  var json = this.generateJSON(this.root);

  this.openOrCreateCache(pathToCache);
  this.setupShellCompletion();

  fs.writeFileSync(pathToCache, json);
};

/**
  Create a file at given `path` in case one does not already exist.

  @private
  @method openOrCreateCache
  @param  {String} path Path to file.
 */

CliCommandGenerator.prototype.openOrCreateCache = function(pathToCache) {
  if (!fs.exists(pathToCache)) {
    fs.openSync(pathToCache, 'w');
  }
};

/**
  Assures to return a valid Project.

  @private
  @method prepareProject
  @param  {Object} project Current project (optional).
  @return {Object}         Either param project or a project constructed from current working directory.
 */

CliCommandGenerator.prototype.prepareProject = function(project) {
  project = project || Project.closestSync(process.cwd());
  project.reloadAddons();
  return project;
};

/**
  Will call setupShellConfig, but only if the current shell config
  wasn't already set up for ember shell completion.

  @private
  @method setupShellCompletion
 */

CliCommandGenerator.prototype.setupShellCompletion = function() {
  var path = this.getShellConfigPath();
  var content = fs.readFileSync(path, 'utf8');

  if (!content.match(/ember completion/)) {
    this.setupShellConfig(path);
  }

};

/**
  Returns path to the config file of currently active shell.

  @private
  @method getShellConfigPath
  @return {String} Path to shell config file.
 */

CliCommandGenerator.prototype.getShellConfigPath = function() {
  return omelette('ember').getDefaultShellInitFile();
};

/**
  Will generate shell completion script and include it to current shell
  config file. Currently supports 'bash' and 'zsh'.

  @private
  @method setupShellConfig
  @param  {String} path Path of shell config
 */

CliCommandGenerator.prototype.setupShellConfig = function(path) {
  switch (path.match(/bash|zsh|^((?!(bash|zsh)).)*$/)[0]) {
    case 'bash':
      this.setupBashConfig(path);
      break;
    case 'zsh':
      this.setupZshConfig(path);
      break;
  }
};

/**
  Will generate shell completion script and include it to the users bash
  config file.

  @private
  @method setupBashConfig
  @param  {String} path Path of bash config
 */

CliCommandGenerator.prototype.setupBashConfig = function(configPath) {
  var directoryPath = path.join(process.env.HOME, '.ember');
  var filePath = path.join(directoryPath, 'completion.sh');

  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath);
  }

  fs.writeFileSync(filePath, omelette('ember').generateCompletionCode());
  fs.appendFileSync(configPath,
                    '\n# begin ember completion\n' +
                    'source ' + filePath +
                    '\n# end ember completion\n');
};

/**
  Will add shell completion support to the users zsh config file.

  @private
  @method setupZshConfig
  @param  {String} path Path of zsh config
 */

CliCommandGenerator.prototype.setupZshConfig = function(configPath) {
  fs.appendFileSync(configPath,
                    '\n# begin ember completion\n' +
                    '. <(ember --completion)' +
                    '\n# end ember completion\n');
};

/**
  Returns a formatted string, representing a hash, containing all
  cli commands and their sub commands recursively with meta data of
  the provided root command

  @private
  @method generateJSON
  @param  {Object} root Root command (default: 'ember')
  @return {string}      All sub commands (recursively) of given root
                        command.
 */

CliCommandGenerator.prototype.generateJSON = function(root) {
  root = root || this.root;

  var json = {commands: [ this.buildCommand(root, []) ] };
  return JSON.stringify(json, null, ' ');
};

/**
  Takes a command and maps it to the final cache file format. Builds all
  sub commands by invoking `cliCommands` on the command with the current
  generator and all already traversed commands as parameter. Calls itself
  recursively on all subcommands.

  @private
  @method buildCommand
  @param  {Object} command        Root command for recursion to start.
  @param  {Array}  parentCommands Names of already traversed commands.
  @return {Object}                Hash with command meta info.
 */

CliCommandGenerator.prototype.buildCommand = function(command, parentCommands) {
  var cliCommands = [];
  if (command.commands && typeof command.commands === 'function') {
    cliCommands = command.commands(this, parentCommands);
  }

  cliCommands = cliCommands.map(function(childCommand) {
    return this.buildCommand(childCommand, parentCommands.concat([command.name]));
  }.bind(this));

  command.commands = cliCommands.filter(function(c) { return c.name; });

  return new CliCommand(command);
};

/**
  Returns paths of all files in a given directory.

  @private
  @method dir
  @param  {String} directoryPath Path of directory to look in.
  @return {Array}                Array of paths of all files inside
                                 `directoryPath`.
 */

function dir(fullPath) {
  if (fs.existsSync(fullPath)) {
    return fs.readdirSync(fullPath).map(function(fileName) {
      return path.join(fullPath, fileName);
    });
  } else {
    return [];
  }
}

/**
  Returns all command constructors of ember-cli

  @private
  @method loadCommands
  @return {Array}                Array of all command constructors of
                                 ember-cli.
 */

function loadCommands(project) {
  return Object.keys(commands).map(function(name) {
    var Constructor = lookupCommand(commands, name.toLowerCase());
    var command = new Constructor({
      project: project
    });

    return new CliCommand(command);
  });
}

/**
  Returns all blueprint modules for a given project.

  @private
  @method loadBluePrints
  @param  {object} project Project to look in.
  @return {Array}          Array of all blueprint modules of
                           a given project.
 */

function loadBlueprints(project) {
  var lookupPaths = project.blueprintLookupPaths() || [];
  var allLookupPaths = lookupPaths.concat(Blueprint.defaultLookupPaths());
  var blueprints = uniq(allLookupPaths).map(function(lookupPath) {
    var blueprintPaths = dir(lookupPath);
    return blueprintPaths.map(function(blueprintPath) {
      var modulePath = path.resolve(blueprintPath, 'index.js');

      if (fs.existsSync(modulePath)) {
        var name = blueprintPath.match(/[^\/]+$/)[0];
        var blueprint = require(modulePath);
        blueprint.name = name;
        return new CliCommand(blueprint);
      } else {
        return null;
      }

    });
  });

  return flatten(blueprints).filter(function(e) {
    return e !== null;
  });
}

/**
  Returns the `ember` root command of all cli commands

  @private
  @method loadRoot
  @return {Array}          `ember` root cli command
 */

function loadRoot() {
  return new CliCommand({
    name: 'ember',
    cliCommands: function(generator) { return generator.commands; }
  });
}

module.exports = CliCommandGenerator;
