'use strict';

let chalk = require('chalk');

module.exports = function(helpString) {
  // currently windows
  if (chalk.supportsColor) {
    return helpString;
  }
  return chalk.stripColor(helpString);
};
