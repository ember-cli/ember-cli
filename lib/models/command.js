'use strict';

var nopt                = require('nopt');
var chalk               = require('chalk');
var path                = require('path');
var isGitRepo           = require('is-git-url');
var camelize            = require('ember-cli-string-utils').camelize;
var getCallerFile       = require('get-caller-file');
var printableProperties = require('../utilities/printable-properties').command;
var printCommand        = require('../utilities/print-command');
var Promise             = require('../ext/promise');
var _                   = require('ember-cli-lodash-subset');
var EOL                 = require('os').EOL;
var CoreObject          = require('core-object');
var logger              = require('heimdalljs-logger')('ember-cli:command');
var Watcher             = require('../models/watcher');
var SilentError         = require('silent-error');

var allowedWorkOptions = {
  insideProject: true,
  outsideProject: true,
  everywhere: true
};

path.name = 'Path';
// extend nopt to recognize 'gitUrl' as a type
nopt.typeDefs.gitUrl = {
  type: 'gitUrl',
  validate: function(data, k, val) {
    if (isGitRepo(val)) {
      data[k] = val;
      return true;
    } else {
      return false;
    }
  }
};

/**
 * The base class for all CLI commands.
 *
 * @module ember-cli
 * @class Command
 * @constructor
 * @extends CoreObject
 */
var Command = CoreObject.extend({
  /**
   * The description of what this command does.
   *
   * @final
   * @property description
   * @type String
   */
  description: null,

  /**
   * Does this command work everywhere or just inside or outside of projects.
   *
   * Possible values:
   *
   * - `insideProject`
   * - `outsideProject`
   * - `everywhere`
   *
   * @final
   * @property works
   * @type String
   * @default `insideProject`
   */
  works: 'insideProject',

  init: function() {
    this._super.apply(this, arguments);

    /**
     * @final
     * @property isWithinProject
     * @type Boolean
     */
    this.isWithinProject = this.project.isEmberCLIProject();

    /**
     * The name of the command.
     *
     * @final
     * @property name
     * @type String
     * @example `new` or `generate`
     */
    this.name = this.name || path.basename(getCallerFile(), '.js');

    logger.info('initialize: name: %s, name: %s', this.name);

    /**
     * An array of aliases for the command
     *
     * @final
     * @property aliases
     * @type Array
     * @example `['g']` for the `generate` command
     */
    this.aliases = this.aliases || [];

    // Works Property
    if (!allowedWorkOptions[this.works]) {
      throw new Error('The "' + this.name + '" command\'s works field has to ' +
                      'be either "everywhere", "insideProject" or "outsideProject".');
    }

    /**
     * An array of available options for the command
     *
     * @final
     * @property availableOptions
     * @type Array
     * @example
     * ```js
     * availableOptions: [
     *   { name: 'dry-run',    type: Boolean, default: false, aliases: ['d'] },
     *   { name: 'verbose',    type: Boolean, default: false, aliases: ['v'] },
     *   { name: 'blueprint',  type: String,  default: 'app', aliases: ['b'] },
     *   { name: 'skip-npm',   type: Boolean, default: false, aliases: ['sn'] },
     *   { name: 'skip-bower', type: Boolean, default: false, aliases: ['sb'] },
     *   { name: 'skip-git',   type: Boolean, default: false, aliases: ['sg'] },
     *   { name: 'directory',  type: String ,                 aliases: ['dir'] }
     * ],
     * ```
     */
    this.availableOptions = this.availableOptions || [];

    /**
     * An array of anonymous options for the command
     *
     * @final
     * @property anonymousOptions
     * @type Array
     * @example
     * ```js
     * anonymousOptions: [
     *   '<blueprint>'
     * ],
     * ```
     */
    this.anonymousOptions = this.anonymousOptions || [];

    this.registerOptions();
  },

  /**
    Registers options with command. This method provides the ability to extend or override command options.
    Expects an object containing anonymousOptions or availableOptions, which it will then merge with
    existing availableOptions before building the optionsAliases which are used to define shorthands.

    @method registerOptions
    @param {Object} options
  */
  registerOptions: function(options) {
    var extendedAvailableOptions = options && options.availableOptions || [];
    var extendedAnonymousOptions = options && options.anonymousOptions || [];

    this.anonymousOptions = _.union(this.anonymousOptions.slice(0), extendedAnonymousOptions);

    // merge any availableOptions
    this.availableOptions = _.union(this.availableOptions.slice(0), extendedAvailableOptions);

    var optionKeys = _.uniq(_.map(this.availableOptions, 'name'));

    optionKeys.map(this.mergeDuplicateOption.bind(this));

    this.optionsAliases = this.optionsAliases || {};

    this.availableOptions.map(this.validateOption.bind(this));
  },

  /**
    Hook for extending a command before it is run in the cli.run command.
    Most common use case would be to extend availableOptions.
    @method beforeRun
    @return {Promise|null}
  */
  beforeRun: function() {

  },

  /**
    @method validateAndRun
    @return {Promise}
  */
  validateAndRun: function(args) {
    var commandOptions = this.parseArgs(args);
    // if the help option was passed, resolve with 'callHelp' to call help command
    if (commandOptions && (commandOptions.options.help || commandOptions.options.h)) {
      logger.info(this.name + ' called with help option');
      return Promise.resolve('callHelp');
    }

    this.analytics.track({
      name:    'ember ',
      message: this.name
    });

    if (commandOptions === null) {
      return Promise.resolve();
    }

    if (this.works === 'outsideProject' && this.isWithinProject) {
      return Promise.reject(new SilentError(
        'You cannot use the ' + chalk.green(this.name) + ' command inside an ember-cli project.'
      ));
    }

    if (this.works === 'insideProject') {
      if (!this.project.hasDependencies()) {
        throw new SilentError('node_modules appears empty, you may need to run `npm install`');
      }
    }

    return Watcher.detectWatcher(this.ui, commandOptions.options).then(function(options) {
      if (options._watchmanInfo) {
        this.project._watchmanInfo = options._watchmanInfo;
      }

      return this.run(options, commandOptions.args);
    }.bind(this));
  },

  /**
    Merges any options with duplicate keys in the availableOptions array.
    Used primarily by registerOptions.
    @method mergeDuplicateOption
    @param {String} key
    @return {Object}
  */
  mergeDuplicateOption: function(key) {
    var duplicateOptions, mergedOption, mergedAliases;
    // get duplicates to merge
    duplicateOptions = _.filter(this.availableOptions, { 'name': key });

    if (duplicateOptions.length > 1) {
      // TODO: warn on duplicates and overwriting
      mergedAliases = [];

      _.map(duplicateOptions, 'aliases').map(function(alias) {
        alias.map(function(a) {
          mergedAliases.push(a);
        });
      });

      // merge duplicate options
      mergedOption = _.assign.apply(null,duplicateOptions);

      // replace aliases with unique aliases
      mergedOption.aliases = _.uniqBy(mergedAliases, function(alias) {
        if (typeof alias === 'object') {
          return alias[Object.keys(alias)[0]];
        }
        return alias;
      });

      // remove duplicates from options
      this.availableOptions = _.reject(this.availableOptions, { 'name': key });
      this.availableOptions.push(mergedOption);
    }
    return this.availableOptions;
  },

  /**
    Normalizes option, filling in implicit values
    @method normalizeOption
    @param {Object} option
    @return {Object}
  */
  normalizeOption: function(option) {
    option.key = camelize(option.name);
    option.required = option.required || false;
    return option;
  },

  /**
    Assigns option
    @method assignOption
    @param {Object} option
    @param {Object} parsedOptions
    @param {Object} commandOptions
    @return {Boolean}
  */
  assignOption: function(option, parsedOptions, commandOptions) {
    var isValid = isValidParsedOption(option, parsedOptions[option.name]);
    if (isValid) {
      if (parsedOptions[option.name] === undefined) {
        if (option.default !== undefined) {
          commandOptions[option.key] = option.default;
        }

        if (this.settings[option.name] !== undefined) {
          commandOptions[option.key] = this.settings[option.name];
        } else if (this.settings[option.key] !== undefined) {
          commandOptions[option.key] = this.settings[option.key];
        }
      } else {
        commandOptions[option.key] = parsedOptions[option.name];
        delete parsedOptions[option.name];
      }
    } else {
      this.ui.writeLine('The specified command ' + chalk.green(this.name) +
                       ' requires the option ' + chalk.green(option.name) + '.');
    }
    return isValid;
  },

  /**
    Validates option
    @method validateOption
    @param {Object} option
    @return {Boolean}
  */
  validateOption: function(option) {
    var parsedAliases;

    if (!option.name || !option.type) {
      throw new Error('The command "' + this.name + '" has an option ' +
                      'without the required type and name fields.');
    }

    if (option.name !== option.name.toLowerCase()) {
      throw new Error('The "' + option.name + '" option\'s name of the "' +
                      this.name + '" command contains a capital letter.');
    }

    this.normalizeOption(option);

    if (option.aliases) {
      parsedAliases = option.aliases.map(this.parseAlias.bind(this, option));
      return parsedAliases.map(this.assignAlias.bind(this, option)).indexOf(false) === -1;
    }
    return false;
  },

  /**
    Parses alias for an option and adds it to optionsAliases
    @method parseAlias
    @param {Object} option
    @param {Object|String} alias
    @return {Object}
  */
  parseAlias: function(option, alias) {
    var aliasType = typeof alias;
    var key, value, aliasValue;

    if (isValidAlias(alias, option.type)) {
      if (aliasType === 'string') {
        key = alias;
        value = ['--' + option.name];
      } else if (aliasType === 'object') {
        key = Object.keys(alias)[0];
        value = ['--' + option.name, alias[key]];
      }
    } else {
      if (Array.isArray(alias)) {
        aliasType = 'array';
        aliasValue = alias.join(',');
      } else {
        aliasValue = alias;
        try {
          aliasValue = JSON.parse(alias);
        } catch (e) {
          var logger = require('heimdalljs-logger')('ember-cli/models/command');
          logger.error(e);
        }
      }
      throw new Error('The "' + aliasValue + '" [type:' + aliasType +
                      '] alias is not an acceptable value. It must be a string or single key' +
                        ' object with a string value (for example, "value" or { "key" : "value" }).');
    }

    return {
      key: key,
      value: value,
      original: alias
    };
  },

  /**
   * @method assignAlias
   * @param option
   * @param alias
   * @return {Boolean}
   */
  assignAlias: function(option, alias) {
    var isValid = this.validateAlias(option, alias);

    if (isValid) {
      this.optionsAliases[alias.key] = alias.value;
    }
    return isValid;
  },

  /**
    Validates alias value
    @method validateAlias
    @param {Object} alias
    @return {Boolean}
  */
  validateAlias: function(option, alias) {
    var key = alias.key;
    var value = alias.value;

    if (!this.optionsAliases[key]) {
      return true;
    } else {
      if (value[0] !== this.optionsAliases[key][0]) {
        throw new SilentError('The "' + key + '" alias is already in use by the "' + this.optionsAliases[key][0] +
          '" option and cannot be used by the "' + value[0] + '" option. Please use a different alias.');
      } else {
        if (value[1] !== this.optionsAliases[key][1]) {
          this.ui.writeLine(chalk.yellow('The "' + key + '" alias cannot be overridden. Please use a different alias.'));
          // delete offending alias from options
          var index = this.availableOptions.indexOf(option);
          var aliasIndex = this.availableOptions[index].aliases.indexOf(alias.original);
          if (this.availableOptions[index].aliases[aliasIndex]) {
            delete this.availableOptions[index].aliases[aliasIndex];
          }
        }
      }
      return false;
    }
  },

  /**
    Parses command arguments and processes
    @method parseArgs
    @param {Object} commandArgs
    @return {Object|null}
  */
  parseArgs: function(commandArgs) {
    var knownOpts      = {}; // Parse options
    var commandOptions = {};
    var parsedOptions;

    var assembleAndValidateOption = function(option) {
      return this.assignOption(option, parsedOptions, commandOptions);
    };

    var validateParsed = function(key) {
      // ignore 'argv', 'h', and 'help'
      if (!commandOptions.hasOwnProperty(key) && key !== 'argv' && key !== 'h' && key !== 'help') {
        this.ui.writeLine(chalk.yellow('The option \'--' + key + '\' is not registered with the ' + this.name + ' command. ' +
                                       'Run `ember ' + this.name + ' --help` for a list of supported options.'));
      }
      if (typeof parsedOptions[key] !== 'object') {
        commandOptions[camelize(key)] = parsedOptions[key];
      }
    };

    this.availableOptions.forEach(function(option) {
      if (typeof option.type !== 'string') {
        knownOpts[option.name] = option.type;
      } else if (option.type === 'Path') {
        knownOpts[option.name] = path;
      } else {
        knownOpts[option.name] = String;
      }
    });

    parsedOptions = nopt(knownOpts, this.optionsAliases, commandArgs, 0);

    if (!this.availableOptions.every(assembleAndValidateOption.bind(this))) {
      return null;
    }

    _.keys(parsedOptions).map(validateParsed.bind(this));

    return {
      options: _.defaults(commandOptions, this.settings),
      args: parsedOptions.argv.remain
    };
  },

  /**
   * @method run
   * @param commandArgs
   */
  run: function(commandArgs) {
    throw new Error('command must implement run' + commandArgs.toString());
  },

  _printCommand: printCommand,

  /**
    Prints basic help for the command.

    Basic help looks like this:

        ember generate <blueprint> <options...>
          Generates new code from blueprints
          aliases: g
          --dry-run (Default: false)
          --verbose (Default: false)

    The default implementation is designed to cover all bases
    but may be overriden if necessary.

    @method printBasicHelp
  */
  printBasicHelp: function() {
    // ember command-name
    var output;
    if (this.isRoot) {
      output = 'Usage: ' + this.name;
    } else {
      output = 'ember ' + this.name;
    }

    output += this._printCommand();
    output += EOL;

    return output;
  },

  /**
    Prints detailed help for the command.

    The default implementation is no-op and should be overridden
    for each command where further help text is required.

    @method printDetailedHelp
  */
  printDetailedHelp: function() {},

  /**
   * @method getJson
   * @param {Object} options
   * @return {Object}
   */
  getJson: function(options) {
    var json = {};

    printableProperties.forEachWithProperty(function(key) {
      json[key] = this[key];
    }, this);

    if (this.addAdditionalJsonForHelp) {
      this.addAdditionalJsonForHelp(json, options);
    }

    return json;
  }
});

/*
  Validates options parsed by nopt
*/
function isValidParsedOption(option, parsedOption) {
  // option.name didn't parse
  if (parsedOption === undefined) {
    // no default
    if (option.default === undefined) {
      if (option.required) {
        return false;
      }
    }
  }

  return true;
}

/*
  Validates alias. Must be a string or single key object
*/
function isValidAlias(alias, expectedType) {
  var type  = typeof alias;
  var value, valueType;
  if (type === 'string') {
    return true;
  } else if (type === 'object') {

    // no arrays, no multi-key objects
    if (!Array.isArray(alias) && Object.keys(alias).length === 1) {
      value = alias[Object.keys(alias)[0]];
      valueType = typeof value;
      if (!Array.isArray(expectedType)) {
        if (valueType === expectedType.name.toLowerCase()) {
          return true;
        }
      } else {
        if (expectedType.indexOf(value) > -1) {
          return true;
        }
      }
    }
  }

  return false;
}

module.exports = Command;
