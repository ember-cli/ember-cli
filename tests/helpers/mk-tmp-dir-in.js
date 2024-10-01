'use strict';

const fs = require('fs-extra');
const temp = require('temp');
const util = require('util');

const mkdirTemp = util.promisify(temp.mkdir);

async function mkTmpDirIn(dir) {
  await fs.ensureDir(dir);
  return mkdirTemp({ dir });
}

module.exports = mkTmpDirIn;
