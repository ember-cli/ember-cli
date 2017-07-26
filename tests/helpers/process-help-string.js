'use strict';

const chalk = require('chalk');
const stripAnsi = require('strip-ansi');

module.exports = function(helpString) {
  // currently windows
  if (chalk.supportsColor) {
    return helpString;
  }
  return stripAnsi(helpString);
};
