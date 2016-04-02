'use strict';

var path     = require('path');
var fs       = require('fs');
var crypto   = require('crypto');
var expect   = require('chai').expect;
var walkSync = require('walk-sync');
var appName  = 'some-cool-app';
var EOL      = require('os').EOL;
var mkdirp   = require('mkdirp');

var runCommand          = require('../helpers/run-command');
var acceptance          = require('../helpers/acceptance');
var copyFixtureFiles    = require('../helpers/copy-fixture-files');
var killCliProcess      = require('../helpers/kill-cli-process');
var assertDirEmpty      = require('ember-cli-internal-test-helpers/lib/helpers/assert-dir-empty');
var ember               = require('../helpers/ember');
var createTestTargets   = acceptance.createTestTargets;
var teardownTestTargets = acceptance.teardownTestTargets;
var linkDependencies    = acceptance.linkDependencies;
var cleanupRun          = acceptance.cleanupRun;

describe('Acceptance: `ember build` smoke test', function() {
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
      assertDirEmpty('tmp');
    });
  });

  it('ember build exits with non-zero code when build fails', function () {
    var appJsPath   = path.join('.', 'app', 'app.js');
    var ouputContainsBuildFailed = false;

    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build').then(function (result) {
      expect(result.code).to.equal(0, 'expected exit code to be zero, but got ' + result.code);

      // add something broken to the project to make build fail
      fs.appendFileSync(appJsPath, '{(syntaxError>$@}{');

      return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', {
        onOutput: function(string) {
          // discard output as there will be a lot of errors and a long stacktrace
          // just mark that the output contains expected text
          if (!ouputContainsBuildFailed && string.match(/Build failed/)) {
            ouputContainsBuildFailed = true;
          }
        }
      });

    }).then(function () {
      expect(false, 'should have rejected with a failing build').to.be.ok;
    }).catch(function (result) {
      expect(ouputContainsBuildFailed, 'command output must contain "Build failed" text').to.be.ok;
      expect(result.code).to.not.equal(0, 'expected exit code to be non-zero, but got ' + result.code);
    });
  });
});
