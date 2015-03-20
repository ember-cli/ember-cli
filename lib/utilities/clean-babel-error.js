'use strict';

module.exports = function cleanBabelError(error) {
  error.stack = error.stack.split('\n').filter(function(frame) {
    return !(/^\>?\s*\d*\s*\|/.test(frame));
  }).join('\n');
};
