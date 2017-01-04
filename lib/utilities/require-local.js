'use strict';

let path = require('path');
let nodeModulesPath = require('node-modules-path');

module.exports = function requireLocal(lib) {
  return require(path.join(nodeModulesPath(process.cwd()), lib));
};
