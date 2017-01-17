'use strict';

const fs = require('fs-extra');
const path = require('path');
const Promise = require('../../lib/ext/promise');
let copy = Promise.denodeify(fs.copy);

let rootPath = process.cwd();

module.exports = function copyFixtureFiles(sourceDir) {
  return copy(path.join(rootPath, 'tests', 'fixtures', sourceDir), '.', { overwrite: true });
};
