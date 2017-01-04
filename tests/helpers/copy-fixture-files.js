'use strict';

let fs = require('fs-extra');
let path = require('path');
let Promise = require('../../lib/ext/promise');
let copy = Promise.denodeify(fs.copy);

let rootPath = process.cwd();

module.exports = function copyFixtureFiles(sourceDir) {
  return copy(path.join(rootPath, 'tests', 'fixtures', sourceDir), '.', { clobber: true });
};
