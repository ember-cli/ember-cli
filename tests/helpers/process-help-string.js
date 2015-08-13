'use strict';

var stripAnsi     = require('strip-ansi');
var supportsColor = require('supports-color');

module.exports = function(helpString) {
  if (supportsColor) {
    return helpString;
  }
  return stripAnsi(helpString);
};
