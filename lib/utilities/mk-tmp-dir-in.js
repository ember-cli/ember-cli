'use strict';

let Promise = require('../ext/promise');
let fs = require('fs-extra');
let temp = require('temp');
let mkdir = Promise.denodeify(fs.mkdir);
let mkdirTemp = Promise.denodeify(temp.mkdir);

function exists(dir) {
  return new Promise(resolve => {
    fs.exists(dir, resolve);
  });
}

function mkTmpDirIn(dir) {
  return exists(dir).then(doesExist => {
    if (!doesExist) {
      return mkdir(dir);
    }
  }).then(() => mkdirTemp({ dir }));
}

module.exports = mkTmpDirIn;
