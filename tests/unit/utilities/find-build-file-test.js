'use strict';

const { expect } = require('chai');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const findBuildFile = require('../../../lib/utilities/find-build-file');

describe('find-build-file', function () {
  let tmpPath;
  let tmpFilename = 'ember-cli-build.js';
  let ROOT = process.cwd();

  beforeEach(function () {
    tmpPath = fs.mkdtempSync(path.join(os.tmpdir(), 'find-build-file-test'));
    process.chdir(tmpPath);
  });

  afterEach(function () {
    process.chdir(ROOT);
    fs.removeSync(tmpPath);
  });

  it('does not throw an error when the file is valid commonjs syntax', async function () {
    fs.writeFileSync(tmpFilename, "module.exports = function() {return {'a': 'A', 'b': 'B'};}", { encoding: 'utf8' });

    let result = await findBuildFile();
    expect(result).to.be.a('function');
    expect(result()).to.deep.equal({ a: 'A', b: 'B' });
  });

  it('does not throw an error when the file is valid ES module syntax', async function () {
    fs.writeFileSync('package.json', JSON.stringify({ type: 'module' }), { encoding: 'utf8' });
    fs.writeFileSync(tmpFilename, "export default function() {return {'a': 'A', 'b': 'B'};}", { encoding: 'utf8' });

    let result = await findBuildFile();
    expect(result).to.be.a('function');
    expect(result()).to.deep.equal({ a: 'A', b: 'B' });
  });

  it('throws a SyntaxError if the file contains a syntax mistake', async function () {
    fs.writeFileSync(tmpFilename, 'module.exports = ', { encoding: 'utf8' });

    let error = null;
    try {
      await findBuildFile();
    } catch (e) {
      error = e;
    }

    expect(error).to.not.equal(null);
    expect(error.constructor).to.equal(SyntaxError);
    expect(error.message).to.match(/Could not `import\('.*ember-cli-build.*'\)`/);
  });

  it('does not throw an error when the file is missing', async function () {
    let result = await findBuildFile(tmpPath);
    expect(result).to.be.null;
  });
});
