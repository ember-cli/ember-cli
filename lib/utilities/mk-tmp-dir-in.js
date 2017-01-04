'use strict';

const Promise = require('../ext/promise');
const fs = require('fs-extra');
const temp = require('temp');
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
