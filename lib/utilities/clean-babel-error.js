'use strict';

var stripAnsi = require('strip-ansi');
module.exports = function cleanBabelError(error) {
  error.stack = typeof error.stack === 'string' &&  error.stack.split('\n').filter(function(frame) {
    return !(/^\>?\s*\d*\s*\|/.test(frame));
  }).join('\n');
  error.message = typeof error.message === 'string' && stripAnsi(error.message);
};
