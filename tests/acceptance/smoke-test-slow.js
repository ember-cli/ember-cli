'use strict';

var tmp      = require('../helpers/tmp');
var conf     = require('../helpers/conf');
var Promise  = require('../../lib/ext/promise');
var path     = require('path');
var rimraf   = Promise.denodeify(require('rimraf'));
var fs       = require('fs');
var crypto   = require('crypto');
var assert   = require('assert');
var walkSync = require('walk-sync');
var appName  = 'some-cool-app';
var ncp      = Promise.denodeify(require('ncp'));

var runCommand       = require('../helpers/run-command');
var copyFixtureFiles = require('../helpers/copy-fixture-files');

function assertTmpEmpty() {
  var paths = walkSync('tmp')
    .filter(function(path) {
      return !path.match(/output\//);
    });

  assert(paths.length === 0, 'tmp/ should be empty after `ember` tasks. Contained: ' + paths.join('\n'));
}

function buildApp(appName) {
  return runCommand(path.join('..', 'bin', 'ember'), 'new', appName, {
    onOutput: function() {
      return; // no output for initial application build
    }
  });
}

describe('Acceptance: smoke-test', function() {
  before(function() {
    this.timeout(360000);

    tmp.setup('./common-tmp');
    process.chdir('./common-tmp');

    conf.setup();
    return buildApp(appName)
      .then(function() {
        return rimraf(path.join(appName, 'node_modules', 'ember-cli'));
      });
  });

  after(function() {
    this.timeout(10000);

    tmp.teardown('./common-tmp');
    conf.restore();
  });

  beforeEach(function() {
    this.timeout(10000);

    tmp.setup('./tmp');
    return ncp('./common-tmp/' + appName, './tmp/' + appName, {
      clobber: true,
      stopOnErr: true
    })
    .then(function() {
      process.chdir('./tmp');

      var appsECLIPath = path.join(appName, 'node_modules', 'ember-cli');
      var pwd = process.cwd();

      fs.symlinkSync(path.join(pwd, '..'), appsECLIPath);

      process.chdir(appName);
    });
  });

  afterEach(function() {
    this.timeout(10000);

    assertTmpEmpty();
    tmp.teardown('./tmp');
  });

  it('ember new foo, clean from scratch', function() {
    console.log('    running the slow end-to-end it will take some time');

    this.timeout(450000);

    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
  });

  it('ember test exits with non-zero when tests fail', function() {
    console.log('    running the slow end-to-end it will take some time');

    this.timeout(450000);

    return copyFixtureFiles('smoke-tests/failing-test')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test')
          .then(function() {
            assert(false, 'should have rejected with a failing test');
          })
          .catch(function(result) {
            assert.equal(result.code, 1);
          });
      });
  });

  it('ember new foo, build production and verify fingerprint', function() {
    console.log('    running the slow fingerprint it will take some time');

    this.timeout(360000);

    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--environment=production')
      .then(function() {
        var dirPath = path.join('.', 'dist', 'assets');
        var dir = fs.readdirSync(dirPath);
        var files = [];

        dir.forEach(function (filepath) {
          if (filepath === '.gitkeep') {
            return;
          }

          files.push(filepath);

          var file = fs.readFileSync(path.join(dirPath, filepath), { encoding: 'utf8' });

          var md5 = crypto.createHash('md5');
          md5.update(file);
          var hex = md5.digest('hex');

          assert(filepath.indexOf(hex) > -1, filepath + ' contains the fingerprint (' + hex + ')');
        });

        var indexHtml = fs.readFileSync(path.join('.', 'dist', 'index.html'), { encoding: 'utf8' });

        files.forEach(function (filename) {
          assert(indexHtml.indexOf(filename) > -1);
        });
      });
  });

  it('ember test --environment=production', function() {
    console.log('    running the slow end-to-end it will take some time');

    this.timeout(450000);

    return copyFixtureFiles('smoke-tests/passing-test')
        .then(function() {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test', '--environment=production')
              .then(function(result) {
                var exitCode = result.code;
                var output = result.output.join('\n');

                assert.equal(exitCode, 0, 'exit code should be 0 for passing tests');

                assert(!output.match('JSHint'), 'JSHint should not be run on production assets');
                assert(output.match(/fail\s+0/), 'no failures');
                assert(output.match(/pass\s+1/), '1 passing');
              })
              .catch(function(result) {
                assert(false, 'failed `ember test --environment=production`.  The following output was received:\n' + result.output.join('\n'));
              });
        });
  });

  it('ember new foo, build development, and verify generated files', function() {
    console.log('    running the slow build tests');

    this.timeout(360000);

    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build')
      .then(function() {
        var dirPath = path.join('.', 'dist');
        var paths = walkSync(dirPath);

        assert(paths.length < 20, 'expected fewer than 20 files in dist, found ' + paths.length);
      });
  });

  it('ember build exits with non-zero code when build fails', function () {
    console.log('    running the slow build tests');
    this.timeout(360000);

    var appJsPath   = path.join('.', 'app', 'app.js');
    var ouputContainsBuildFailed = false;

    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build')
      .then(function (result) {
        assert(result.code === 0, 'expected exit code to be zero, but got ' + result.code);

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
        assert(false, 'should have rejected with a failing build');
      }).catch(function (result) {
        assert(ouputContainsBuildFailed, 'command output must contain "Build failed" text');
        assert(result.code !== 0, 'expected exit code to be non-zero, but got ' + result.code);
      });
  });

  it('ember new foo, build --watch development, and verify rebuilt after change', function() {
    console.log('    running the slow build --watch tests');
    this.timeout(360000);

    var touched     = false;
    var appJsPath   = path.join('.', 'app', 'app.js');
    var builtJsPath = path.join('.', 'dist', 'assets', 'some-cool-app.js');
    var text        = 'anotuhaonteuhanothunaothanoteh';
    var line        = 'console.log("' + text + '");';

    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--watch', {
        onOutput: function(string, process) {
          if (touched) {
            if (string.match(/Build successful/)) {
              // build after change to app.js
              var contents  = fs.readFileSync(builtJsPath).toString();
              assert(contents.indexOf(text) > 1, 'must contain changed line after rebuild');
              process.kill('SIGINT');
            }
          } else {
            if (string.match(/Build successful/)) {
              // first build
              touched = true;
              fs.appendFileSync(appJsPath, line);
            }
          }
        }
      })
      .catch(function() {
        // swallowing because of SIGINT
      });
  });

  it('ember new foo, build --watch development, and verify rebuilt after multiple changes', function() {
    console.log('    running the slow build --watch tests');
    this.timeout(360000);

    var buildCount  = 0;
    var touched     = false;
    var appJsPath   = path.join('.', 'app', 'app.js');
    var builtJsPath = path.join('.', 'dist', 'assets', 'some-cool-app.js');
    var firstText   = 'anotuhaonteuhanothunaothanoteh';
    var firstLine   = 'console.log("' + firstText + '");';
    var secondText  = 'aahsldfjlwioruoiiononociwewqwr';
    var secondLine  = 'console.log("' + secondText + '");';

    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--watch', {
        onOutput: function(string, process) {
          if (buildCount === 0) {
            if (string.match(/Build successful/)) {
              // first build
              touched = true;
              buildCount = 1;
              fs.appendFileSync(appJsPath, firstLine);
            }
          } else if (buildCount === 1) {
            if (string.match(/Build successful/)) {
              // second build
              touched = true;
              buildCount = 2;
              fs.appendFileSync(appJsPath, secondLine);
            }
          } else if (touched && buildCount === 2) {
            if (string.match(/Build successful/)) {
              // build after change to app.js
              var contents  = fs.readFileSync(builtJsPath).toString();
              assert(contents.indexOf(secondText) > 1, 'must contain second changed line after rebuild');
              process.kill('SIGINT');
            }
          }
        }
      })
      .catch(function() {
        // swallowing because of SIGINT
      });
  });

  it('ember new foo, server, SIGINT clears tmp/', function() {
    console.log('    running the slow build tests');

    this.timeout(360000);

    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'server', '--port=54323','--live-reload=false', {
        onOutput: function(string, process) {
          if (string.match(/Build successful/)) {
            process.kill('SIGINT');
          }
        }
      })
      .catch(function() {
        // just eat the rejection as we are testing what happens
      });
  });

  it('ember new foo, build production and verify css files are concatenated', function() {
    this.timeout(450000);
    return copyFixtureFiles('with-styles')
      .then(function() {
      return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--environment=production')
        .then(function() {
          var dirPath = path.join('.', 'dist', 'assets');
          var dir = fs.readdirSync(dirPath);
          var cssNameRE = new RegExp(appName + '-([a-f0-9]+)\\.css','i');
          dir.forEach(function (filepath) {
            if(cssNameRE.test(filepath)) {
              var appCss = fs.readFileSync(path.join('.', 'dist', 'assets', filepath), { encoding: 'utf8' });
              assert(appCss.indexOf('.some-weird-selector')>-1);
              assert(appCss.indexOf('.some-even-weirder-selector')>-1);
            }
          });
        });
    });
  });
});
