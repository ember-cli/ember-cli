'use strict';

const expect = require('../../chai').expect;
const cleanRemove = require('../../../lib/utilities/clean-remove');
const temp = require('temp');
const path = require('path');
const fs = require('fs-extra');

describe('clean-remove', function () {
  let tempDir;
  let originalCwd = process.cwd();
  let fileInfo;
  let nestedPath = 'nested1/nested2';

  beforeEach(function () {
    tempDir = temp.mkdirSync('clean-remove');
    process.chdir(tempDir);

    fileInfo = {
      outputBasePath: tempDir,
    };
  });

  afterEach(function () {
    process.chdir(originalCwd);
    fs.removeSync(tempDir);
  });

  it('removes empty folders', function () {
    let displayPath = path.join(nestedPath, 'file.txt');
    fileInfo.outputPath = path.join(tempDir, displayPath);
    fileInfo.displayPath = displayPath;

    return fs
      .outputFile(displayPath, '')
      .then(function () {
        return fs.stat(displayPath).then(function (stats) {
          expect(stats).to.be.ok;
        });
      })
      .then(function () {
        return cleanRemove(fileInfo);
      })
      .then(function () {
        return expect(fs.stat('nested1')).to.be.rejected;
      });
  });

  it('preserves filled folders', function () {
    let removedDisplayPath = path.join(nestedPath, 'file.txt');
    let preservedDisplayPath = path.join(nestedPath, 'file2.txt');
    fileInfo.outputPath = path.join(tempDir, removedDisplayPath);
    fileInfo.displayPath = removedDisplayPath;

    return fs
      .outputFile(removedDisplayPath, '')
      .then(function () {
        return fs.outputFile(preservedDisplayPath, '');
      })
      .then(function () {
        return fs.stat(preservedDisplayPath).then(function (stats) {
          expect(stats).to.be.ok;
        });
      })
      .then(function () {
        return cleanRemove(fileInfo);
      })
      .then(function () {
        return expect(fs.stat(removedDisplayPath)).to.be.rejected;
      })
      .then(function () {
        return fs.stat(preservedDisplayPath).then(function (stats) {
          expect(stats).to.be.ok;
        });
      });
  });
});
