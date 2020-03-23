'use strict';

const fs = require('fs-extra');

let root = process.cwd();

module.exports.setup = function (path) {
  process.chdir(root);

  return fs.remove(path).then(function () {
    fs.mkdirsSync(path);
  });
};

module.exports.teardown = function (path) {
  process.chdir(root);
  return fs.remove(path);
};
