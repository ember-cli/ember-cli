'use strict';

var expect = require('chai').expect;
var fs = require('fs-extra');
var path = require('path');
var tmp = require('../../helpers/tmp');
var findBuildFile = require('../../../lib/utilities/find-build-file');

describe('find-build-file', function() {
  var tmpPath = 'tmp/find-build-file-test';
  var tmpFilename = 'ember-cli-build.js';

  beforeEach(function() {
    return tmp.setup(tmpPath)
      .then(function() {
        process.chdir(tmpPath);
      });
  });

  afterEach(function() {
    var tmpFilePath = path.resolve(tmpFilename);
    delete require.cache[require.resolve(tmpFilePath)];

    return tmp.teardown(tmpPath);
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
