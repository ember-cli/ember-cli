'use strict';

var Promise = require('../ext/promise');
var findCommand = require('./package-manager-command');

/**
  Runs the npm command `command` with the supplied args and load options.

  Please note that the loaded module appears to retain some state, so do not
  expect multiple invocations within the same process to work without quirks.
  This problem is likely fixable.

  @method npm
  @param {String} command The npm command to run.
  @param {Array} npmArgs The arguments passed to the npm command.
  @param {Array} options The options passed when loading npm.
  @param {Module} [npm] A reference to the npm module.
*/

module.exports = function npm(commandText, npmArgs, options/*, npm*/) {
  var lib;
  if (arguments.length === 4) {
    lib = arguments[3];
  } else {
    lib = require('npm');
  }

  var load = Promise.denodeify(lib.load);

  return load(options)
    .then(function() {
      // if install is denodeified outside load.then(),
      // it throws "Call npm.load(config, cb) before using this command."
      var command = findCommand(lib, commandText);
      if (typeof command !== 'function') {
        throw new Error('`npm '+ commandText + '` not found');
      }

      var operation = Promise.denodeify(command);

      return operation(npmArgs || []);
    });
};
