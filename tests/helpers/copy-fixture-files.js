'use strict';

const fs = require('fs-extra');
const path = require('path');

let rootPath = process.cwd();

module.exports = function copyFixtureFiles(sourceDir) {
  return fs.copy(path.join(rootPath, 'tests', 'fixtures', sourceDir), '.', { overwrite: true });
};
