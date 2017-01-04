'use strict';

const execa = require('execa');
const RSVP = require('rsvp');
const SilentError = require('silent-error');

/**
  Runs the npm command with the supplied args.

  @method npm
  @param {Array} args The arguments passed to the npm command.
*/
module.exports = function npm(args) {
  let npmPath;
  try {
    npmPath = require.resolve('npm/bin/npm-cli.js');
  } catch (error) {
    return RSVP.reject(error);
  }

  return RSVP.cast(execa(npmPath, args)).catch(error => {
    throw new SilentError(error.message);
  });
};
