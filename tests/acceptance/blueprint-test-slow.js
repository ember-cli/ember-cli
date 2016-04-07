'use strict';

var path                = require('path');
var fs                  = require('fs');
var acceptance          = require('../helpers/acceptance');
var runCommand          = require('../helpers/run-command');
var createTestTargets   = acceptance.createTestTargets;
var teardownTestTargets = acceptance.teardownTestTargets;
var linkDependencies    = acceptance.linkDependencies;
var cleanupRun          = acceptance.cleanupRun;

var chai = require('chai');
var chaiFiles = require('chai-files');

chai.use(chaiFiles);

var expect = chai.expect;
var dir = chaiFiles.dir;

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
    return cleanupRun().then(function() {
      expect(dir('tmp')).to.be.empty;
    });
  });

  it('generating an http-proxy installs packages to package.json', function() {
    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'generate',
                      'http-proxy',
                      'api',
                      'http://localhost/api')
      .then(function() {
        var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
        var packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        expect(!packageJson.devDependencies['http-proxy']).to.not.be.an('undefined');
        expect(!packageJson.devDependencies['morgan']).to.not.be.an('undefined');
      });
  });
});
