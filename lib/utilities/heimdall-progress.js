'use strict';

module.exports = function progress(heimdalljs = require('heimdalljs')) {
  let current = heimdalljs.current;
  const stack = [current.id.name];

  while (current = current.parent) { // eslint-disable-line
    stack.push(current.id.name);
  }

  return stack
    .filter((name) => name !== 'heimdall')
    .reverse()
    .join(' > ');
};

module.exports.format = function (text) {
  return require('chalk').green('building... ') + (text ? `[${text}]` : '');
};
