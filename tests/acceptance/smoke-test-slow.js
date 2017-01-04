'use strict';

var path = require('path');
var fs = require('fs-extra');
var crypto = require('crypto');
var walkSync = require('walk-sync');
var EOL = require('os').EOL;

var runCommand = require('../helpers/run-command');
var acceptance = require('../helpers/acceptance');
var copyFixtureFiles = require('../helpers/copy-fixture-files');
var killCliProcess = require('../helpers/kill-cli-process');
var ember = require('../helpers/ember');
var experiments = require('../../lib/experiments/');
var createTestTargets = acceptance.createTestTargets;
var teardownTestTargets = acceptance.teardownTestTargets;
var linkDependencies = acceptance.linkDependencies;
var cleanupRun = acceptance.cleanupRun;

var chai = require('../chai');
var expect = chai.expect;
var file = chai.file;
var dir = chai.dir;

var appName = 'some-cool-app';
var appRoot;

describe('Acceptance: smoke-test', function() {
  this.timeout(500000);
  before(function() {
    return createTestTargets(appName);
  });

  after(teardownTestTargets);

  beforeEach(function() {
    appRoot = linkDependencies(appName);
  });

  afterEach(function() {
    delete process.env._TESTEM_CONFIG_JS_RAN;
    cleanupRun(appName);
    expect(dir(appRoot)).to.not.exist;
  });

  it('ember new foo, clean from scratch', function() {
    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
  });

  it('ember new foo, make sure addon template overwrites', function() {
    return ember(['generate', 'template', 'foo'])
      .then(function() {
        return ember(['generate', 'in-repo-addon', 'my-addon']);
      })
      .then(function() {
        // this should work, but generating a template in an addon/in-repo-addon doesn't
        // do the right thing: update once https://github.com/ember-cli/ember-cli/issues/5687
        // is fixed
        //return ember(['generate', 'template', 'foo', '--in-repo-addon=my-addon']);

        // temporary work around
        var templatePath = path.join('lib', 'my-addon', 'app', 'templates', 'foo.hbs');
        fs.mkdirsSync(path.dirname(templatePath));
        fs.writeFileSync(templatePath, 'Hi, Mom!', { encoding: 'utf8' });
      })
      .then(function() {
        var packageJsonPath = path.join('lib', 'my-addon', 'package.json');
        var packageJson = fs.readJsonSync(packageJsonPath);
        packageJson.dependencies = packageJson.dependencies || {};
        packageJson.dependencies['ember-cli-htmlbars'] = '*';

        fs.writeJsonSync(packageJsonPath, packageJson);

        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build')
          .then(function(result) {
            expect(result.code).to.equal(0);
          })
          .catch(function() {
            expect(false, 'should not have rejected with an error').to.be.ok;
          });
      });
  });

  it('ember test still runs when a JavaScript testem config exists', function() {
    return copyFixtureFiles('smoke-tests/js-testem-config')
      .then(function() {
        return ember(['test']);
      })
      .then(function() {
        expect(process.env._TESTEM_CONFIG_JS_RAN).to.be.ok;
      });
  });

  // there is a bug in here when running the entire suite on Travis
  // when run in isolation, it passes
  // here is the error:
  // test-support-80f2fe63fae0c44478fe0f8af73200a7.js contains the fingerprint (2871106928f813936fdd64f4d16005ac): expected 'test-support-80f2fe63fae0c44478fe0f8af73200a7.js' to include '2871106928f813936fdd64f4d16005ac'
  it.skip('ember new foo, build production and verify fingerprint', function() {
    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--environment=production')
      .then(function() {
        var dirPath = path.join(appRoot, 'dist', 'assets');
        var dir = fs.readdirSync(dirPath);
        var files = [];

        dir.forEach(function(filepath) {
          if (filepath === '.gitkeep') {
            return;
          }

          files.push(filepath);

          var file = fs.readFileSync(path.join(dirPath, filepath), { encoding: null });

          var md5 = crypto.createHash('md5');
          md5.update(file);
          var hex = md5.digest('hex');

          expect(filepath).to.contain(hex, filepath + ' contains the fingerprint (' + hex + ')');
        });

        var indexHtml = file('dist/index.html');
        files.forEach(function(filename) {
          expect(indexHtml).to.contain(filename);
        });
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

        return ember(['test', '--path=dist']);
      }).finally(function() {
        process.stdout.write = originalWrite;
      })
      .then(function(result) {
        expect(result.exitCode).to.equal(0, 'exit code should be 0 for passing tests');

        output = output.join(EOL);

        expect(output).to.match(/fail\s+0/, 'no failures');
        expect(output).to.match(/pass\s+2/, '2 passing');
      });
  });

  it('ember new foo, build development, and verify generated files', function() {
    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build')
      .then(function() {
        var dirPath = path.join(appRoot, 'dist');
        var paths = walkSync(dirPath);

        expect(paths).to.have.length.below(24, 'expected fewer than 24 files in dist, found ' + paths.length);
      });
  });

  it('ember build exits with non-zero code when build fails', function() {
    var appJsPath = path.join(appRoot, 'app', 'app.js');
    var ouputContainsBuildFailed = false;

    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build').then(function(result) {
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
        },
      });

    }).then(function() {
      expect(false, 'should have rejected with a failing build').to.be.ok;
    }).catch(function(result) {
      expect(ouputContainsBuildFailed, 'command output must contain "Build failed" text').to.be.ok;
      expect(result.code).to.not.equal(0, 'expected exit code to be non-zero, but got ' + result.code);
    });
  });


  if (experiments.INSTRUMENTATION) {
    it('ember build generates instrumentation files when viz is enabled', function() {
      process.env.BROCCOLI_VIZ = '1';

      return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', {
        env: {
          BROCCOLI_VIZ: '1',
        },
      }).then(function() {
        [
          'instrumentation.build.0.json',
          'instrumentation.command.json',
          'instrumentation.init.json',
          'instrumentation.shutdown.json',
        ].forEach(function(instrumentationFile) {
          expect(fs.existsSync(instrumentationFile)).to.equal(true);

          var json = fs.readJsonSync(instrumentationFile);
          expect(Object.keys(json)).to.eql([
            'summary', 'nodes',
          ]);

          expect(Array.isArray(json.nodes)).to.equal(true);
        });
      })
        .finally(function() {
          delete process.env.BROCCOLI_VIZ;
        });
    });
  }

  it('ember new foo, build --watch development, and verify rebuilt after change', function() {
    var touched = false;
    var appJsPath = path.join(appRoot, 'app', 'app.js');
    var builtJsPath = path.join(appRoot, 'dist', 'assets', 'some-cool-app.js');
    var text = 'anotuhaonteuhanothunaothanoteh';
    var line = 'console.log("' + text + '");';

    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--watch', {
      onOutput: function(string, child) {
        if (touched) {
          if (string.match(/Build successful/)) {
            // build after change to app.js
            var contents = fs.readFileSync(builtJsPath).toString();
            expect(contents).to.contain(text, 'must contain changed line after rebuild');
            killCliProcess(child);
          }
        } else if (string.match(/Build successful/)) {
          // first build
          touched = true;
          fs.appendFileSync(appJsPath, line);
        }
      },
    }).catch(function() {
      // swallowing because of SIGINT
    });
  });

  it('ember new foo, build --watch development, and verify rebuilt after multiple changes', function() {
    var buildCount = 0;
    var touched = false;
    var appJsPath = path.join(appRoot, 'app', 'app.js');
    var builtJsPath = path.join(appRoot, 'dist', 'assets', 'some-cool-app.js');
    var firstText = 'anotuhaonteuhanothunaothanoteh';
    var firstLine = 'console.log("' + firstText + '");';
    var secondText = 'aahsldfjlwioruoiiononociwewqwr';
    var secondLine = 'console.log("' + secondText + '");';

    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--watch', {
      onOutput: function(string, child) {
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
            var contents = fs.readFileSync(builtJsPath).toString();
            expect(contents).to.contain(secondText, 'must contain second changed line after rebuild');
            killCliProcess(child);
          }
        }
      },
    }).catch(function() {
      // swallowing because of SIGINT
    });
  });

  it('ember new foo, server, SIGINT clears tmp/', function() {
    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'server', '--port=54323', '--live-reload=false', {
      onOutput: function(string, child) {
        if (string.match(/Build successful/)) {
          killCliProcess(child);
        }
      },
    }).catch(function() {
      // just eat the rejection as we are testing what happens
    });
  });

  it('ember new foo, build production and verify css files are concatenated', function() {
    return copyFixtureFiles('with-styles').then(function() {
      return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--environment=production')
        .then(function() {
          var dirPath = path.join(appRoot, 'dist', 'assets');
          var dir = fs.readdirSync(dirPath);
          var cssNameRE = new RegExp(appName + '-([a-f0-9]+)\\.css', 'i');
          dir.forEach(function(filepath) {
            if (cssNameRE.test(filepath)) {
              expect(file('dist/assets/' + filepath))
                .to.contain('.some-weird-selector')
                .to.contain('.some-even-weirder-selector');
            }
          });
        });
    });
  });

  it('ember new foo, build production and verify single "use strict";', function() {
    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--environment=production')
      .then(function() {
        var dirPath = path.join(appRoot, 'dist', 'assets');
        var dir = fs.readdirSync(dirPath);
        var appNameRE = new RegExp(appName + '-([a-f0-9]+)\\.js', 'i');
        dir.forEach(function(filepath) {
          if (appNameRE.test(filepath)) {
            var contents = fs.readFileSync(path.join(appRoot, 'dist', 'assets', filepath), { encoding: 'utf8' });
            var count = (contents.match(/(["'])use strict\1;/g) || []).length;
            expect(count).to.equal(1);
          }
        });
      });
  });

  it('ember can override and reuse the built-in blueprints', function() {
    return copyFixtureFiles('addon/with-blueprint-override')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'generate', 'component', 'foo-bar', '-p');
      })
      .then(function() {
        // because we're overriding, the fileMapTokens is default, sans 'component'
        expect(file('app/foo-bar/component.js')).to.contain('generated component successfully');
      });
  });

  it('template linting works properly for pods and classic structured templates', function() {
    return copyFixtureFiles('smoke-tests/with-template-failing-linting')
      .then(function() {
        var packageJsonPath = 'package.json';
        var packageJson = fs.readJsonSync(packageJsonPath);
        packageJson.devDependencies = packageJson.devDependencies || {};
        packageJson.devDependencies['fake-template-linter'] = 'latest';

        return fs.writeJsonSync(packageJsonPath, packageJson);
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
