'use strict';

const expect = require('chai').expect;
const path = require('path');
const loadConfig = require('../../../lib/utilities/load-config');

describe('load-config', function() {
  let fixtureDirectory = path.resolve(__dirname, '../../fixtures/load-config');

  it('loads and parses a yml file', function() {
    expect(loadConfig('.travis.yml', fixtureDirectory).hello).to.equal('world');
  });
  it('loads and parses a yaml file', function() {
    expect(loadConfig('.travis.yml', fixtureDirectory).hello).to.equal('world');
  });
  it('loads and parses a json file', function() {
    expect(loadConfig('package.json', fixtureDirectory).hello).to.equal('world');
  });
  it('loads a vanilla file', function() {
    expect(loadConfig('.something', fixtureDirectory)).to.equal('hello: world\n');
  });
  it('works across directories', function() {
    expect(loadConfig('.something', path.join(fixtureDirectory, 'child'))).to.equal('hello: world\n');
    expect(loadConfig('test.json', path.join(fixtureDirectory, 'child')).hello).to.equal('world');
  });
});

describe('publishes the appropriate config files', function() {
  let EmberCLIDir = path.resolve(__dirname, '../../../');
  let npmignore = loadConfig('.npmignore', EmberCLIDir);

  it('has the config files', function() {
    expect(npmignore).to.include('!.travis.yml');
    expect(npmignore).to.include('!appveyor.yml');
  });
});
