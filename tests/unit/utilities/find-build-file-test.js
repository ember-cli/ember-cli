'use strict';

var expect = require('chai').expect;
var fs = require('fs-extra');
var tmp = require('../../helpers/tmp');
var findBuildFile = require('../../../lib/utilities/find-build-file');

describe('find-build-file', function() {
  var tmpPath, tmpFilename, tmpFilePath;
  var currentWorkingDir = process.cwd();

  beforeEach(function() {
    tmpPath = process.cwd() + '/tmp/';
    tmpFilename = 'ember-cli-build.js';
    tmpFilePath = tmpPath + tmpFilename;
    return tmp.setup(tmpPath)
      .then(function() {
        process.chdir(tmpPath);
      });
  });

  afterEach(function() {
    delete require.cache[require.resolve(tmpFilePath)];
    return tmp.teardown(tmpPath).then(function() {
      process.chdir(currentWorkingDir);
    });
  });

  it('does not throws an error when the file is valid syntax', function() {
    fs.writeFileSync(tmpFilename, 'module.exports = function() {return {\'a\': \'A\', \'b\': \'B\'};}', { encoding: 'utf8' });

    expect(function() {
      findBuildFile(tmpFilename);
    }).to.not.throw();
  });

  it('throws an SyntaxError if the file contains a syntax mistake', function() {
    fs.writeFileSync(tmpFilename, 'module.exports = function() {return {\'a\': \'A\' \'b\': \'B\'};}', { encoding: 'utf8' });

    expect(function() {
      findBuildFile(tmpFilename);
    }).to.throw(SyntaxError, /Could not require '.*':/);
  });
});
