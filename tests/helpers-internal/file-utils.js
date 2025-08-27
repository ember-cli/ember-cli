'use strict';

const fs = require('fs-extra');
const path = require('path');

const { expect } = require('chai');
const { file } = require('chai-files');

function checkFile(inputPath, outputPath) {
  if (process.env.WRITE_FIXTURES) {
    let content = fs.readFileSync(inputPath, { encoding: 'utf-8' });

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, content, { encoding: 'utf-8' });
  }

  expect(file(inputPath)).to.equal(file(outputPath));
}

module.exports = {
  checkFile,
};
