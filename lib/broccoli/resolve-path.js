'use strict';

const path = require('path');
const ensurePosix = require('ensure-posix-path');
const { moduleResolve } = require('amd-name-resolver');

const BASE_DIR = path.resolve(`${__dirname}/..`);

function modueId(modulePath) {
  return ensurePosix(path.relative(process.cwd(), modulePath));
}

function resolvePath(name, child) {
  return moduleResolve(name, modueId(child));
}

module.exports = {
  modueId,
  resolvePath,
};

Object.keys(module.exports).forEach((key) => {
  module.exports[key].baseDir = () => BASE_DIR;

  module.exports[key]._parallelBabel = {
    requireFile: __filename,
    useMethod: key,
  };
});
