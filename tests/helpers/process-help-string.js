'use strict';

const chalk = require('chalk');
// eslint-disable-next-line n/no-unpublished-require
const stripAnsi = import('strip-ansi');

module.exports = function (helpString) {
  // currently windows
  if (chalk.supportsColor) {
    return helpString;
  }
  return stripAnsi(helpString);
};
