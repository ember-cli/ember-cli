'use strict';

module.exports = function symbol(name) {
  var id = `EMBER_CLI${Math.floor(Math.random() * new Date())}`;
  return `__${name}__ [id=${id}]`;
};
