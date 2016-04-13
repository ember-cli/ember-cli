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

describe('Acceptance: `ember test` smoke test', function() {
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

  it('ember test exits with non-zero when tests fail', function() {
    return copyFixtureFiles('smoke-tests/failing-test')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test')
          .then(function() {
            expect(false, 'should have rejected with a failing test').to.be.ok;
          })
          .catch(function(result) {
            expect(result.code).to.equal(1);
          });
      });
  });

  it('ember test exits with non-zero when build fails', function() {
    return copyFixtureFiles('smoke-tests/test-with-syntax-error')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test')
          .then(function() {
            expect(false, 'should have rejected with a failing test').to.be.ok;
          })
          .catch(function(result) {
            expect(result.code).to.equal(1);
          });
      });
  });

  it('ember test exits with non-zero when no tests are run', function() {
    return copyFixtureFiles('smoke-tests/no-testem-launchers')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test')
          .then(function() {
            expect(false, 'should have rejected with a failing test').to.be.ok;
          })
          .catch(function(result) {
            expect(result.code).to.equal(1);
          });
      });
  });

  // TODO: re-enable, something is funky with test cleanup...
  // it('ember test exits with zero when tests pass', function() {
  //   return copyFixtureFiles('smoke-tests/passing-test')
  //     .then(function() {
  //       return ember(['test'])
  //         .then(function(result) {
  //           expect(result.code).to.equal(0);
  //         })
  //         .catch(function() {
  //           expect(false, 'should NOT have rejected with a failing test');
  //         });
  //     });
  // });

  it('ember test still runs when only a JavaScript testem config exists', function() {
    return copyFixtureFiles('smoke-tests/js-testem-config')
      .then(function() {
        return ember(['test']);
      })
      .then(function() {
        expect(!!process.env._TESTEM_CONFIG_JS_RAN).to.equal(true);
      });
  });

  // TODO: restore, test harness npm appears to incorrectly dedupe broccoli-filter, causing this test to fail.
  // manually testing that case, it seems to work correctly, will restore soon.
  it.skip('ember test --environment=production', function() {
    return copyFixtureFiles('smoke-tests/passing-test')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test', '--environment=production');
      })
      .then(function(result) {
        var exitCode = result.code;
        var output = result.output.join(EOL);

        expect(exitCode).to.equal(0, 'exit code should be 0 for passing tests');
        expect(output).to.match(/JSHint/, 'JSHint should be run on production assets');
        expect(output).to.match(/fail\s+0/, 'no failures');
        expect(output).to.match(/pass\s+\d+/, 'man=y passing');
      });
  });

  it('ember test --path with previous build', function() {
    var originalWrite = process.stdout.write;
    var output = [];

    return copyFixtureFiles('smoke-tests/passing-test')
      .then(function() {
        // TODO: Change to using ember() helper once it properly saves build artifacts
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      })
      .then(function() {
        // TODO: Figure out how to get this to write into the MockUI
        process.stdout.write = (function() {
          return function() {
            output.push(arguments[0]);
          };
        }(originalWrite));

        return ember([ 'test', '--path=dist' ]);
      }).finally(function() {
        process.stdout.write = originalWrite;
      })
      .then(function(result) {
        expect(result.exitCode).to.equal(0, 'exit code should be 0 for passing tests');

        output = output.join(EOL);

        expect(output).to.match(/JSHint/, 'JSHint should be run');
        expect(output).to.match(/fail\s+0/, 'no failures');
        expect(output).to.match(/pass\s+12/, '1 passing');
      });
  });
});
