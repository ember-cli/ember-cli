'use strict';

var execa = require('execa');
var RSVP = require('rsvp');
var SilentError = require('silent-error');

/**
  Runs the npm command with the supplied args.

  @method npm
  @param {Array} args The arguments passed to the npm command.
*/
module.exports = function npm(args) {
  var npmPath;
  try {
    npmPath = require.resolve('npm/bin/npm-cli.js');
  } catch (error) {
    return RSVP.reject(error);
  }

  return RSVP.cast(execa(npmPath, args)).catch(function(error) {
    throw new SilentError(error.message);
  });
};
