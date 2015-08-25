'use strict';

/**
  CliCommand takes a blueprint module or command instance or any custom hash and
  constructs an object that provides `name`, `commands`, `alias` and `options` fields
  that are sanitized for shell completion.

  Will return `null` if no name is provided.

  @class CliCommand
  @extends CoreObject
  @constructor
  @param  {Object} options Hash your cli command will be build from.
                           Usually blueprint module or command instance.
*/


var CliCommand = function(options) {

  if (!options || !options.name) {
    return null;
  }

  this.name = options.name;
  this.commands = options.cliCommands || options.commands || [];
  this.aliases = buildAliases( options.aliases || []);
  this.options = buildOptions( options.availableOptions || options.options || []);
  return this;
};

/**
  Receives a list of `availableOptions` and returns a list only containing
  shell completion relevant options.

  @private
  @method buildOptions
  @param  {Array} options List of options to build from.
  @return {Array}         Sanitized list of options for shell completion.
 */

function buildOptions(options) {
  return options.filter(function(option) {
    return !!option.type;
  }).map(function(option) {
    return {
      name: option.name,
      type: option.type.name || option.type
    };
  });
}

/**
  Receives a list of `aliases` and returns a list filtered by relevant items for
  shell completion.

  @private
  @method buildAliases
  @param  {Array} options List of aliases to filter.
  @return {Array}         Filtered list of aliases for shell completion.
 */

function buildAliases(aliases) {
  return aliases.filter(function(alias) {
    return typeof alias === 'string';
  });
}

module.exports = CliCommand;
