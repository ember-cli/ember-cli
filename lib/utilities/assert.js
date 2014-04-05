'use strict';

module.exports = function assert(errorMessage, test) {
  if (!test) {
    throw new Error(errorMessage);
  }
};
