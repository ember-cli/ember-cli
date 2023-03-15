'use strict';

const { expect } = require('chai');
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

  it('removes empty folders', async function () {
    let displayPath = path.join(nestedPath, 'file.txt');
    fileInfo.outputPath = path.join(tempDir, displayPath);
    fileInfo.displayPath = displayPath;

    await fs.outputFile(displayPath, '');
    let stats = await fs.stat(displayPath);
    expect(stats).to.be.ok;
    await cleanRemove(fileInfo);
    return expect(fs.stat('nested1')).to.be.rejected;
  });

  it('preserves filled folders', async function () {
    let removedDisplayPath = path.join(nestedPath, 'file.txt');
    let preservedDisplayPath = path.join(nestedPath, 'file2.txt');
    fileInfo.outputPath = path.join(tempDir, removedDisplayPath);
    fileInfo.displayPath = removedDisplayPath;

    await fs.outputFile(removedDisplayPath, '');
    await fs.outputFile(preservedDisplayPath, '');

    expect(await fs.stat(preservedDisplayPath)).to.be.ok;

    await cleanRemove(fileInfo);
    await expect(fs.stat(removedDisplayPath)).to.be.rejected;

    expect(await fs.stat(preservedDisplayPath)).to.be.ok;
  });
});
