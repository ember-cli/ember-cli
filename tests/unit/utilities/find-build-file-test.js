'use strict';

const expect = require('chai').expect;
const fs = require('fs-extra');
const path = require('path');
const tmp = require('../../helpers/tmp');
const findBuildFile = require('../../../lib/utilities/find-build-file');

describe('find-build-file', function() {
  let tmpPath = 'tmp/find-build-file-test';
  let tmpFilename = 'ember-cli-build.js';

  beforeEach(function() {
    return tmp.setup(tmpPath).then(function() {
      process.chdir(tmpPath);
    });
  });

  afterEach(function() {
    let tmpFilePath = path.resolve(tmpFilename);
    delete require.cache[require.resolve(tmpFilePath)];

    return tmp.teardown(tmpPath);
  });

  it('does not throw an error when the file is valid syntax', function() {
    fs.writeFileSync(tmpFilename, "module.exports = function() {return {'a': 'A', 'b': 'B'};}", { encoding: 'utf8' });

    let result = findBuildFile(tmpFilename);
    expect(result).to.be.a('function');
    expect(result()).to.deep.equal({ a: 'A', b: 'B' });
  });

  it('throws a SyntaxError if the file contains a syntax mistake', function() {
    fs.writeFileSync(tmpFilename, "module.exports = function() {return {'a': 'A' 'b': 'B'};}", { encoding: 'utf8' });

    expect(() => {
      findBuildFile(tmpFilename);
    }).to.throw(SyntaxError, /Could not require '.*':/);
  });

  it('does not throw an error when the file is mss', function() {
    let result = findBuildFile('missing-file.js');
    expect(result).to.be.null;
  });
});
