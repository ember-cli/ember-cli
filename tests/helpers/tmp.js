'use strict';

let fs = require('fs-extra');
let existsSync = require('exists-sync');
let Promise = require('../../lib/ext/promise');
let remove = Promise.denodeify(fs.remove);
let root = process.cwd();

module.exports.setup = function(path) {
  process.chdir(root);

  return remove(path)
    .then(function() {
      fs.mkdirsSync(path);
    });
};

module.exports.teardown = function(path) {
  process.chdir(root);
  return remove(path);
};
