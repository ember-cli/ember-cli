'use strict';

const path = require('path');
const fs = require('fs-extra');
const acceptance = require('../helpers/acceptance');
const runCommand = require('../helpers/run-command');
let createTestTargets = acceptance.createTestTargets;
let teardownTestTargets = acceptance.teardownTestTargets;
let linkDependencies = acceptance.linkDependencies;
let cleanupRun = acceptance.cleanupRun;

const chai = require('../chai');
let expect = chai.expect;
let dir = chai.dir;

let appName = 'some-cool-app';
let appRoot;

describe('Acceptance: blueprint smoke tests', function() {
  this.timeout(500000);

  before(function() {
    return createTestTargets(appName);
  });

  after(teardownTestTargets);

  beforeEach(function() {
    appRoot = linkDependencies(appName);
  });

  afterEach(function() {
    cleanupRun(appName);
    expect(dir(appRoot)).to.not.exist;
  });

  it('generating an http-proxy installs packages to package.json', function() {
    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'generate',
                      'http-proxy',
                      'api',
                      'http://localhost/api')
      .then(function() {
        let packageJsonPath = path.join(appRoot, 'package.json');
        let packageJson = fs.readJsonSync(packageJsonPath);

        expect(packageJson.devDependencies).to.have.a.property('http-proxy');
        expect(packageJson.devDependencies).to.have.a.property('morgan');
      });
  });
});
