'use strict';

var fs      = require('fs-extra');
var Promise = require('../../lib/ext/promise');
var rimraf  = Promise.denodeify(require('rimraf'));
var root    = process.cwd();

module.exports.setup = function(path) {
  process.chdir(root);

  return rimraf(path)
    .then(function() {
      fs.mkdirsSync(path);
    });
};

module.exports.teardown = function(path) {
  process.chdir(root);

  if (fs.existsSync(path)) {
    return rimraf(path);
  } else {
    return Promise.resolve();
  }
};
