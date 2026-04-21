'use strict';

const { supportsColor } = require('chalk');
// eslint-disable-next-line n/no-unpublished-require
const { default: stripAnsi } = require('strip-ansi');

module.exports = function (helpString) {
  // currently windows
  if (supportsColor) {
    return helpString;
  }
  return stripAnsi(helpString);
};
