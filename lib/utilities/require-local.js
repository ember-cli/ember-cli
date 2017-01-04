'use strict';

const path = require('path');
const nodeModulesPath = require('node-modules-path');

module.exports = function requireLocal(lib) {
  return require(path.join(nodeModulesPath(process.cwd()), lib));
};
