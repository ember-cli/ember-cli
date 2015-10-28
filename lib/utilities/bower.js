'use strict';

var Promise = require('../ext/promise');
var findCommand = require('./package-manager-command');
var chalk = require('chalk');

/**
 Runs the bower command `command` with the supplied args.

 @method bower
 @param {String} command The bower command to run.
 @param {Array} bowerArgs The arguments passed to the bower command.
 @param {Array} options The options passed to the bower command
 @param {Module} [npm] A reference to the bower module.
 */

// module.exports = function bowerCommand(commandText, bowerArgs, options, config, bower, ui) {
module.exports = function bowerCommand(commandText, bowerArgs, bower, options, ui) {
  var lib = bower || require('bower');

  return new Promise(function(resolve, reject) {
    var command = findCommand(lib, commandText);

    if (typeof command !== 'function') {
      throw new Error('`bower '+ commandText + '` not found');
    }

    var commandResult = command.apply(undefined, bowerArgs || [])
      .on('error', reject)
      .on('end', resolve);

    if (ui) {
      if (options) {
        commandResult.on('log', logBowerMessage(ui, options));
      }
      if (typeof ui.prompt === 'function') {
        commandResult.on('prompt', ui.prompt.bind(ui));
      }
    }

    return commandResult;
  });
};

function logBowerMessage(ui, options) {
  options = options || {};

  return function(message) {
    if (message.level === 'conflict') {
      // e.g.
      //   conflict Unable to find suitable version for ember-data
      //     1) ember-data 1.0.0-beta.6
      //     2) ember-data ~1.0.0-beta.7
      ui.writeLine('  ' + chalk.red('conflict') + ' ' + message.message);
      message.data.picks.forEach(function(pick, index) {
        ui.writeLine('    ' + chalk.green((index + 1) + ')') + ' ' +
                     message.data.name + ' ' + pick.endpoint.target);
      });
    } else if (message.level === 'info' && options.verbose) {
      // e.g.
      //   cached git://example.com/some-package.git#1.0.0
      ui.writeLine('  ' + chalk.green(message.id) + ' ' + message.message);
    }
  };
}

