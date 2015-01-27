'use strict';

var path    = require('path');
var Promise = require('../../lib/ext/promise');
var ncp     = Promise.denodeify(require('ember-cli-ncp'));

var rootPath = process.cwd();

module.exports = function copyFixtureFiles(sourceDir) {
  return ncp(path.join(rootPath, 'tests', 'fixtures', sourceDir), '.', {
    clobber: true,
    stopOnErr: true
  });
};
