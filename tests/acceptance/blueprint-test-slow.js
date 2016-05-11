'use strict';

var path                = require('path');
var fs                  = require('fs-extra');
var acceptance          = require('../helpers/acceptance');
var runCommand          = require('../helpers/run-command');
var createTestTargets   = acceptance.createTestTargets;
var teardownTestTargets = acceptance.teardownTestTargets;
var linkDependencies    = acceptance.linkDependencies;
var cleanupRun          = acceptance.cleanupRun;

var chai = require('../chai');
var expect = chai.expect;
var dir = chai.dir;

var appName  = 'some-cool-app';

describe('Acceptance: blueprint smoke tests', function() {
  this.timeout(500000);

  before(function() {
    return createTestTargets(appName);
  });

  after(function() {
    return teardownTestTargets();
  });

  beforeEach(function() {
    return linkDependencies(appName);
  });

  afterEach(function() {
    return cleanupRun(appName).then(function() {
      expect(dir('tmp/' + appName)).to.not.exist;
    });
  });

  it('generating an http-proxy installs packages to package.json', function() {
    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'generate',
                      'http-proxy',
                      'api',
                      'http://localhost/api')
      .then(function() {
        var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
        var packageJson = fs.readJsonSync(packageJsonPath);

        expect(packageJson.devDependencies).to.have.a.property('http-proxy');
        expect(packageJson.devDependencies).to.have.a.property('morgan');
      });
  });
});
