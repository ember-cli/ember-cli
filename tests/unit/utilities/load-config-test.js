'use strict';

const expect = require('chai').expect;
const path = require('path');
const loadConfig = require('../../../lib/utilities/load-config');
const broccoliTestHelper = require('broccoli-test-helper');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;

describe('load-config', function() {
  let fixtureDirectoryPath, fixtureDirectory;

  before(async function() {
    fixtureDirectory = await createTempDir();
    fixtureDirectoryPath = fixtureDirectory.path();

    fixtureDirectory.write({
      '.something': 'hello: world\n',
      '.travis.yaml': 'hello: world',
      '.travis.yml': 'hello: world',
      'package.json': '{ "hello": "world" }',
      child: {
        'test.json': '{ "hello": "world" }',
      },
    });

    await buildOutput(fixtureDirectoryPath);
  });

  after(async function() {
    await fixtureDirectory.dispose();
  });

  it('loads and parses a yml file', function() {
    expect(loadConfig('.travis.yml', fixtureDirectoryPath).hello).to.equal('world');
  });
  it('loads and parses a yaml file', function() {
    expect(loadConfig('.travis.yml', fixtureDirectoryPath).hello).to.equal('world');
  });
  it('loads and parses a json file', function() {
    expect(loadConfig('package.json', fixtureDirectoryPath).hello).to.equal('world');
  });
  it('loads a vanilla file', function() {
    expect(loadConfig('.something', fixtureDirectoryPath)).to.equal('hello: world\n');
  });
  it('works across directories', function() {
    expect(loadConfig('.something', path.join(fixtureDirectoryPath, 'child'))).to.equal('hello: world\n');
    expect(loadConfig('test.json', path.join(fixtureDirectoryPath, 'child')).hello).to.equal('world');
  });
});

describe('publishes the appropriate config files', function() {
  let EmberCLIDir = path.resolve(__dirname, '../../../');
  let npmignore = loadConfig('.npmignore', EmberCLIDir);

  it('has the config files', function() {
    expect(npmignore).to.include('!/.travis.yml');
  });
});
