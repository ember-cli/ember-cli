'use strict';

module.exports = function(name) {
  return new Function('return function ' + name + '() {};')();
};
