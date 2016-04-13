'use strict';

var path     = require('path');
var fs       = require('fs');
var crypto   = require('crypto');
var walkSync = require('walk-sync');
var appName  = 'some-cool-app';
var EOL      = require('os').EOL;
var mkdirp   = require('mkdirp');

var runCommand          = require('../helpers/run-command');
var acceptance          = require('../helpers/acceptance');
var copyFixtureFiles    = require('../helpers/copy-fixture-files');
var killCliProcess      = require('../helpers/kill-cli-process');
var ember               = require('../helpers/ember');
var createTestTargets   = acceptance.createTestTargets;
var teardownTestTargets = acceptance.teardownTestTargets;
var linkDependencies    = acceptance.linkDependencies;
var cleanupRun          = acceptance.cleanupRun;

var chai = require('chai');
var chaiFiles = require('chai-files');

chai.use(chaiFiles);

var expect = chai.expect;
var dir = chaiFiles.dir;

describe('Acceptance: smoke-test', function() {
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
    delete process.env._TESTEM_CONFIG_JS_RAN;

    return cleanupRun().then(function() {
      expect(dir('tmp')).to.not.exist;
    });
  });

  it('ember can override and reuse the built-in blueprints', function() {
    return copyFixtureFiles('addon/with-blueprint-override')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'generate', 'component', 'foo-bar', '-p');
      })
      .then(function() {
        // because we're overriding, the fileMapTokens is default, sans 'component'
        var componentPath = path.join('app','foo-bar','component.js');
        var contents = fs.readFileSync(componentPath, { encoding: 'utf8' });

        expect(contents).to.contain('generated component successfully');
      });
  });

  it('template linting works properly for pods and classic structured templates', function() {
    return copyFixtureFiles('smoke-tests/with-template-failing-linting')
      .then(function() {
        var packageJsonPath = 'package.json';
        var packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
        packageJson.devDependencies = packageJson.devDependencies || {};
        packageJson.devDependencies['fake-template-linter'] = 'latest';

        return fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      })
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test')
          .then(function() {
            expect(false, 'should have rejected with a failing test').to.be.ok;
          })
          .catch(function(result) {
            var output = result.output.join(EOL);
            expect(output).to.match(/TemplateLint:/, 'ran template linter');
            expect(output).to.match(/fail\s+2/, 'two templates failed linting');
            expect(result.code).to.equal(1);
          });
      });
  });
});
