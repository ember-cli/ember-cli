'use strict';

const fs = require('fs-extra');
const temp = require('temp');
const util = require('util');

const mkdirTemp = util.promisify(temp.mkdir);

function mkTmpDirIn(dir) {
  return fs.ensureDir(dir).then(() => mkdirTemp({ dir }));
}

module.exports = mkTmpDirIn;
