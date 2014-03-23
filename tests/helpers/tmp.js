'use strict';

var fs = require('fs-extra');
var mkdirSync = fs.mkdirSync;
var rimraf = require('rimraf');
var root = process.cwd();

module.exports.setup = function(path) {
  process.chdir(root);
  if (fs.existsSync(path)) {
    rimraf.sync(path);
  }
  mkdirSync(path);
};

module.exports.teardown = function(path) {
  process.chdir(root);
  rimraf.sync(path);
};
