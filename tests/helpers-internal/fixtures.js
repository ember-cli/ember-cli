'use strict';

const fs = require('fs-extra');
const path = require('path');

const { expect } = require('chai');
const { file } = require('chai-files');
const { set, get, cloneDeep } = require('lodash');

const currentVersion = require('../../package').version;

function checkEslintConfig(fixturePath) {
  expect(file('eslint.config.mjs')).to.equal(
    file(path.join(__dirname, '../fixtures', fixturePath, 'eslint.config.mjs'))
  );
}

function checkFileWithJSONReplacement(fixtureName, fileName, targetPath, value) {
  let fixturePath = path.join(__dirname, '../fixtures', fixtureName, fileName);
  let fixtureContents = fs.readFileSync(fixturePath, { encoding: 'utf-8' });
  let fixtureData = JSON.parse(fixtureContents);

  let candidateContents = fs.readFileSync(fileName, 'utf8');
  let candidateData = JSON.parse(candidateContents);

  if (process.env.WRITE_FIXTURES) {
    let newFixtureData = cloneDeep(candidateData);
    set(newFixtureData, targetPath, get(fixtureData, targetPath));
    fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
    fs.writeFileSync(fixturePath, `${JSON.stringify(newFixtureData, null, 2)}\n`, { encoding: 'utf-8' });
  }

  set(fixtureData, targetPath, value);

  expect(JSON.stringify(candidateData, null, 2)).to.equal(JSON.stringify(fixtureData, null, 2));
}

function checkEmberCLIBuild(fixtureName, fileName) {
  let fixturePath = path.join(__dirname, '../fixtures', fixtureName, fileName);
  let fixtureContents = fs.readFileSync(fixturePath, { encoding: 'utf-8' });
  expect(file(fileName)).to.equal(fixtureContents);
}

module.exports = {
  currentVersion,
  checkEslintConfig,
  checkFileWithJSONReplacement,
  checkEmberCLIBuild,
};
