'use strict';

var path = require('path');
var fs = require('fs-extra');
var acceptance = require('../helpers/acceptance');
var runCommand = require('../helpers/run-command');
var createTestTargets = acceptance.createTestTargets;
var teardownTestTargets = acceptance.teardownTestTargets;
var linkDependencies = acceptance.linkDependencies;
var cleanupRun = acceptance.cleanupRun;

var chai = require('../chai');
var expect = chai.expect;
var dir = chai.dir;

var appName = 'some-cool-app';
var appRoot;

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
        var packageJsonPath = path.join(appRoot, 'package.json');
        var packageJson = fs.readJsonSync(packageJsonPath);

        expect(packageJson.devDependencies).to.have.a.property('http-proxy');
        expect(packageJson.devDependencies).to.have.a.property('morgan');
      });
  });
});
