'use strict';

var path = require('path');

module.exports = function requireLocal(lib) {
  return require(path.join(process.cwd(), 'node_modules', lib));
};
