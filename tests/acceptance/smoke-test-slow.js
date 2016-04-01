'use strict';

var Promise    = require('../../lib/ext/promise');
var path       = require('path');
var fs         = require('fs-extra');
var crypto     = require('crypto');
var walkSync   = require('walk-sync');
var existsSync = require('exists-sync');
var appName    = 'some-cool-app';
var EOL        = require('os').EOL;
var mkdirp     = require('mkdirp');
var remove     = Promise.denodeify(fs.remove);

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
var chai                = require('chai');
var chaiFiles           = require('chai-files');

chai.use(chaiFiles);

var expect = chai.expect;
var file = chaiFiles.file;

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
      assertDirEmpty('tmp');
    });
  });
  describe('ember new', function() {
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
          mkdirp.sync(path.dirname(templatePath));
          fs.writeFileSync(templatePath, 'Hi, Mom!', { encoding: 'utf8' });
        })
        .then(function() {
          var packageJsonPath = path.join('lib','my-addon','package.json');
          var packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
          packageJson.dependencies = packageJson.dependencies || {};
          packageJson.dependencies['ember-cli-htmlbars'] = '*';

          fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build')
            .then(function(result) {
              expect(result.code).to.equal(0);
            })
            .catch(function() {
              expect(false, 'should not have rejected with an error').to.be.ok;
            });
        });
    });
  });
  describe('ember test', function() {
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
  describe('ember build', function() {
    // there is a bug in here when running the entire suite on Travis
    // when run in isolation, it passes
    // here is the error:
    // test-support-80f2fe63fae0c44478fe0f8af73200a7.js contains the fingerprint (2871106928f813936fdd64f4d16005ac): expected 'test-support-80f2fe63fae0c44478fe0f8af73200a7.js' to include '2871106928f813936fdd64f4d16005ac'
    it.skip('ember new foo, build production and verify fingerprint', function() {
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

            var file = fs.readFileSync(path.join(dirPath, filepath), { encoding: null });

            var md5 = crypto.createHash('md5');
            md5.update(file);
            var hex = md5.digest('hex');

            expect(filepath).to.contain(hex, filepath + ' contains the fingerprint (' + hex + ')');
          });

          var indexHtml = fs.readFileSync(path.join('.', 'dist', 'index.html'), { encoding: 'utf8' });

          files.forEach(function (filename) {
            expect(indexHtml).to.contain(filename);
          });
        });
    });
    it('ember new foo, build development, and verify generated files', function() {
      return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build')
        .then(function() {
          var dirPath = path.join('.', 'dist');
          var paths = walkSync(dirPath);

          expect(paths).to.have.length.below(23, 'expected fewer than 23 files in dist, found ' + paths.length);
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

    it('ember new foo, build --watch development, and verify rebuilt after change', function() {
      var touched     = false;
      var appJsPath   = path.join('.', 'app', 'app.js');
      var builtJsPath = path.join('.', 'dist', 'assets', 'some-cool-app.js');
      var text        = 'anotuhaonteuhanothunaothanoteh';
      var line        = 'console.log("' + text + '");';

      return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--watch', {
        onOutput: function(string, child) {
          if (touched) {
            if (string.match(/Build successful/)) {
              // build after change to app.js
              var contents  = fs.readFileSync(builtJsPath).toString();
              expect(contents).to.contain(text, 'must contain changed line after rebuild');
              killCliProcess(child);
            }
          } else {
            if (string.match(/Build successful/)) {
              // first build
              touched = true;
              fs.appendFileSync(appJsPath, line);
            }
          }
        }
      }).catch(function() {
        // swallowing because of SIGINT
      });
    });

    it('ember new foo, build --watch development, and verify rebuilt after multiple changes', function() {
      var buildCount  = 0;
      var touched     = false;
      var appJsPath   = path.join('.', 'app', 'app.js');
      var builtJsPath = path.join('.', 'dist', 'assets', 'some-cool-app.js');
      var firstText   = 'anotuhaonteuhanothunaothanoteh';
      var firstLine   = 'console.log("' + firstText + '");';
      var secondText  = 'aahsldfjlwioruoiiononociwewqwr';
      var secondLine  = 'console.log("' + secondText + '");';

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
              var contents  = fs.readFileSync(builtJsPath).toString();
              expect(contents.indexOf(secondText), 'must contain second changed line after rebuild').to.be.above(1);
              killCliProcess(child);
            }
          }
        }
      }).catch(function() {
        // swallowing because of SIGINT
      });
    });
  });
  describe('ember server', function() {
    it('ember new foo, server, SIGINT clears tmp/', function() {
      return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'server', '--port=54323','--live-reload=false', {
        onOutput: function(string, child) {
          if (string.match(/Build successful/)) {
            killCliProcess(child);
          }
        }
      }).catch(function() {
        // just eat the rejection as we are testing what happens
      });
    });

    it('ember new foo, build production and verify css files are concatenated', function() {
      return copyFixtureFiles('with-styles').then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--environment=production')
          .then(function() {
            var dirPath = path.join('.', 'dist', 'assets');
            var dir = fs.readdirSync(dirPath);
            var cssNameRE = new RegExp(appName + '-([a-f0-9]+)\\.css','i');
            dir.forEach(function (filepath) {
              if (cssNameRE.test(filepath)) {
                var appCss = fs.readFileSync(path.join('.', 'dist', 'assets', filepath), { encoding: 'utf8' });
                expect(appCss).to.contain('.some-weird-selector');
                expect(appCss).to.contain('.some-even-weirder-selector');
              }
            });
          });
      });
    });

    it('ember new foo, build production and verify single "use strict";', function() {
      return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--environment=production')
        .then(function() {
          var dirPath = path.join('.', 'dist', 'assets');
          var dir = fs.readdirSync(dirPath);
          var appNameRE = new RegExp(appName + '-([a-f0-9]+)\\.js','i');
          dir.forEach(function(filepath) {
            if (appNameRE.test(filepath)) {
              var contents = fs.readFileSync(path.join('.', 'dist', 'assets', filepath), { encoding: 'utf8' });
              var count = (contents.match(/(["'])use strict\1;/g) || []).length;
              expect(count).to.equal(1);
            }
          });
        });
    });
  });
  describe('blueprints and structures', function() {
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
  describe('blueprint-slow-test', function() {
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
  describe('brocfile-smoke-test', function() {
    it('a custom EmberENV in config/environment.js is used for window.EmberENV', function() {
      return copyFixtureFiles('brocfile-tests/custom-ember-env')
        .then(function() {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
        })
        .then(function() {
          var vendorContents = fs.readFileSync(path.join('dist', 'assets', 'vendor.js'), {
            encoding: 'utf8'
          });

          var expected = 'window.EmberENV = {"asdflkmawejf":";jlnu3yr23"};';
          expect(vendorContents).to.contain(expected, 'EmberENV should be in assets/vendor.js');
        });
    });

    it('a custom environment config can be used in Brocfile.js', function() {
      return copyFixtureFiles('brocfile-tests/custom-environment-config')
        .then(function() {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
        });
    });

    it('without app/templates', function() {
      return copyFixtureFiles('brocfile-tests/pods-templates')
        .then(function() {
          // remove ./app/templates
          return remove(path.join(process.cwd(), 'app/templates'));
        }).then(function() {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
        });
    });

    it('strips app/styles or app/templates from JS', function() {
      return copyFixtureFiles('brocfile-tests/styles-and-templates-stripped')
        .then(function() {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
        })
        .then(function() {
          var appFileContents = fs.readFileSync(path.join('.', 'dist', 'assets', appName + '.js'), {
            encoding: 'utf8'
          });

          expect(appFileContents).to.include('//app/templates-stuff.js');
          expect(appFileContents).to.include('//app/styles-manager.js');
        });
    });

    it('should fall back to the Brocfile', function() {
      return copyFixtureFiles('brocfile-tests/no-ember-cli-build').then(function() {
        fs.removeSync('./ember-cli-build.js');
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      }).then(function() {
        expect(existsSync(path.join('.', 'Brocfile.js'))).to.be.ok;
        expect(existsSync(path.join('.', 'ember-cli-build.js'))).to.be.not.ok;
      });
    });

    it('should use the Brocfile if both a Brocfile and ember-cli-build exist', function() {
      return copyFixtureFiles('brocfile-tests/both-build-files').then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      }).then(function(result) {
        var vendorContents = fs.readFileSync(path.join('dist', 'assets', 'vendor.js'), {
          encoding: 'utf8'
        });

        var expected = 'var usingBrocfile = true;';

        expect(vendorContents).to.contain(expected, 'includes file imported from Brocfile');
        expect(result.output.join('\n')).to.include('Brocfile.js has been deprecated');
      });
    });

    it('should throw if no build file is found', function() {
      fs.removeSync('./ember-cli-build.js');
      return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build').catch(function(err) {
        expect(err.code).to.eql(1);
      });
    });

    it('using autoRun: true', function() {
      return copyFixtureFiles('brocfile-tests/auto-run-true')
        .then(function() {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
        })
        .then(function() {
          var appFileContents = fs.readFileSync(path.join('.', 'dist', 'assets', appName + '.js'), {
            encoding: 'utf8'
          });

          expect(appFileContents).to.match(/\/app"\)\["default"\]\.create\(/);
        });
    });

    it('using autoRun: false', function() {

      return copyFixtureFiles('brocfile-tests/auto-run-false')
        .then(function() {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
        })
        .then(function() {
          var appFileContents = fs.readFileSync(path.join('.', 'dist', 'assets', appName + '.js'), {
            encoding: 'utf8'
          });

          expect(appFileContents).to.not.match(/\/app"\)\["default"\]\.create\(/);
        });
    });

    it('default development build does not fail', function() {
      return copyFixtureFiles('brocfile-tests/query')
        .then(function() {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
        });
    });

    it('default development build tests', function() {
      return copyFixtureFiles('brocfile-tests/default-development')
      .then(function() {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
      });
    });

    it('app.import works properly with test tree files', function() {
      return copyFixtureFiles('brocfile-tests/app-test-import')
        .then(function() {
          var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
          var packageJson = JSON.parse(fs.readFileSync(packageJsonPath,'utf8'));
          packageJson.devDependencies['ember-test-addon'] = 'latest';

          return fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
        })
        .then(function() {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
        })
        .then(function() {
          var subjectFileContents = fs.readFileSync(path.join('.', 'dist', 'assets', 'test-support.js'), {
            encoding: 'utf8'
          });

          expect(subjectFileContents.indexOf('// File for test tree imported and added via postprocessTree()') > 0).to.equal(true);
        });
    });

    it('app.import works properly with non-js/css files', function() {
      return copyFixtureFiles('brocfile-tests/app-import')
        .then(function() {
          var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
          var packageJson = JSON.parse(fs.readFileSync(packageJsonPath,'utf8'));
          packageJson.devDependencies['ember-random-addon'] = 'latest';

          return fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
        })
        .then(function() {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
        })
        .then(function() {
          var subjectFileContents = fs.readFileSync(path.join('.', 'dist', 'assets', 'file-to-import.txt'), {
            encoding: 'utf8'
          });

          expect(subjectFileContents).to.equal('EXAMPLE TEXT FILE CONTENT\n');
        });
    });

    it('app.import fails when options.type is not `vendor` or `test`', function() {
      return copyFixtureFiles('brocfile-tests/app-import')
        .then(function() {
          var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
          var packageJson = JSON.parse(fs.readFileSync(packageJsonPath,'utf8'));
          packageJson.devDependencies['ember-bad-addon'] = 'latest';

          return fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
        })
        .then(function() {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
        })
        .then(function() {
          expect(false, 'Build passed when it should have failed!').to.be.ok;
        }, function() {
          expect(true, 'Build failed with invalid options type.').to.be.ok;
        });
    });

    it('addons can have a public tree that is merged and returned namespaced by default', function() {
      return copyFixtureFiles('brocfile-tests/public-tree')
        .then(function() {
          var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
          var packageJson = JSON.parse(fs.readFileSync(packageJsonPath,'utf8'));
          packageJson.devDependencies['ember-random-addon'] = 'latest';

          return fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
        })
        .then(function() {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
        })
        .then(function() {
          var subjectFileContents = fs.readFileSync(path.join('.', 'dist', 'ember-random-addon', 'some-root-file.txt'), {
            encoding: 'utf8'
          });

          expect(subjectFileContents).to.equal('ROOT FILE\n');
        });
    });

    it('using pods based templates', function() {
      return copyFixtureFiles('brocfile-tests/pods-templates')
        .then(function() {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
        });
    });

    it('using pods based templates with a podModulePrefix', function() {
      return copyFixtureFiles('brocfile-tests/pods-with-prefix-templates')
        .then(function() {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
        });
    });

    it('addon trees are not jshinted', function() {
      return copyFixtureFiles('brocfile-tests/jshint-addon')
        .then(function() {
          var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
          var packageJson = JSON.parse(fs.readFileSync(packageJsonPath,'utf8'));
          packageJson['ember-addon'] = {
            paths: ['./lib/ember-random-thing']
          };

          fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));

          var badContent = 'var blah = ""\n' + 'export default Blah;';
          var appPath = path.join('.', 'lib', 'ember-random-thing', 'app',
                                            'routes', 'horrible-route.js');
          var testSupportPath = path.join('.', 'lib', 'ember-random-thing', 'test-support',
                                            'unit', 'routes', 'horrible-route-test.js');

          fs.writeFileSync(appPath, badContent);
          fs.writeFileSync(testSupportPath, badContent);
        })
        .then(function() {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test', '--filter=jshint');
        });
    });

    it('specifying custom output paths works properly', function() {
      return copyFixtureFiles('brocfile-tests/custom-output-paths')
        .then(function () {
          var themeCSSPath = path.join(__dirname, '..', '..', 'tmp', appName, 'app', 'styles', 'theme.css');
          return fs.writeFileSync(themeCSSPath, 'html, body { margin: 20%; }');
        })
        .then(function() {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
        })
        .then(function() {
          var files = [
            '/css/app.css',
            '/css/theme/a.css',
            '/js/app.js',
            '/css/vendor.css',
            '/js/vendor.js',
            '/css/test-support.css',
            '/js/test-support.js',
            '/my-app.html'
          ];

          var basePath = path.join('.', 'dist');
          files.forEach(function(file) {
            expect(existsSync(path.join(basePath, file)), file + ' exists').to.be.true;
          });
        });
    });

    it('multiple css files in app/styles/ are output when a preprocessor is not used', function() {
      return copyFixtureFiles('brocfile-tests/multiple-css-files')
        .then(function() {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
        })
        .then(function() {
          var files = [
            '/assets/some-cool-app.css',
            '/assets/other.css'
          ];

          var basePath = path.join('.', 'dist');
          files.forEach(function(file) {
            expect(existsSync(path.join(basePath, file)), file + ' exists').to.be.true;
          });
        });
    });

    it('supports deprecated legacyFilesToAppend and vendorStaticFiles', function() {
      return copyFixtureFiles('brocfile-tests/app-import-with-legacy-files')
        .then(function () {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
        })
        .then(function(result) {
          expect(result.output.join('\n')).to.include('Usage of EmberApp.legacyFilesToAppend is deprecated. Please use EmberApp.import instead for the following files: \'vendor/legacy-file.js\', \'vendor/second-legacy-file.js\'');
          expect(result.output.join('\n')).to.include('Usage of EmberApp.vendorStaticStyles is deprecated. Please use EmberApp.import instead for the following files: \'vendor/legacy-file.css\'');

          expect(file('dist/assets/vendor.js')).to.contain('legacy-file.js');
          expect(file('dist/assets/vendor.js')).to.contain('second-legacy-file.js');
          expect(file('dist/assets/vendor.css')).to.contain('legacy-file.css');
        });
    });

    it('specifying outputFile results in a explicitly generated assets', function() {
      return copyFixtureFiles('brocfile-tests/app-import-output-file')
        .then(function () {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
        })
        .then(function() {
          var files = [
            '/assets/output-file.js',
            '/assets/output-file.css',
            '/assets/vendor.css',
            '/assets/vendor.js'
          ];

          var basePath = path.join('.', 'dist');
          files.forEach(function(file) {
            expect(existsSync(path.join(basePath, file))).to.be.true;
          });
        });
    });

    // skipped because of potentially broken assertion that should be fixed correctly at a later point
    it.skip('specifying partial `outputPaths` hash deep merges options correctly', function() {
      return copyFixtureFiles('brocfile-tests/custom-output-paths')
        .then(function () {

          var themeCSSPath = path.join(__dirname, '..', '..', 'tmp', appName, 'app', 'styles', 'theme.css');
          fs.writeFileSync(themeCSSPath, 'html, body { margin: 20%; }');

          var brocfilePath = path.join(__dirname, '..', '..', 'tmp', appName, 'ember-cli-build.js');
          var brocfile = fs.readFileSync(brocfilePath, 'utf8');

          // remove outputPaths.app.js option
          brocfile = brocfile.replace(/js: '\/js\/app.js'/, '');
          // remove outputPaths.app.css.app option
          brocfile = brocfile.replace(/'app': '\/css\/app\.css',/, '');

          fs.writeFileSync(brocfilePath, brocfile, 'utf8');
        })
        .then(function() {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
        })
        .then(function() {
          var files = [
            '/css/theme/a.css',
            '/assets/some-cool-app.js',
            '/css/vendor.css',
            '/js/vendor.js',
            '/css/test-support.css',
            '/js/test-support.js'
          ];

          var basePath = path.join('.', 'dist');
          files.forEach(function(file) {
            expect(existsSync(path.join(basePath, file)), file + ' exists').to.be.true;
          });

          expect(existsSync(path.join(basePath, '/assets/some-cool-app.css')), 'default app.css should not exist').to.be.false;
        });
    });

    it('multiple paths can be CSS preprocessed', function() {
      return copyFixtureFiles('brocfile-tests/multiple-sass-files')
        .then(function() {
          var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
          var packageJson = JSON.parse(fs.readFileSync(packageJsonPath, { encoding: 'utf8' }));
          packageJson.devDependencies['broccoli-sass'] = 'latest';

          return fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
        })
        .then(function() {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
        })
        .then(function() {
          var mainCSS = fs.readFileSync(path.join('.', 'dist', 'assets', 'main.css'), {
            encoding: 'utf8'
          });
          var themeCSS = fs.readFileSync(path.join('.', 'dist', 'assets', 'theme', 'a.css'), {
            encoding: 'utf8'
          });

          expect(mainCSS).to.equal('body { background: black; }\n', 'main.css contains correct content');
          expect(themeCSS).to.equal('.theme { color: red; }\n', 'theme/a.css contains correct content');
        });
    });

    it('app.css is output to <app name>.css by default', function() {
      return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build')
        .then(function() {
          var exists = existsSync(path.join('.', 'dist', 'assets', appName + '.css'));

          expect(exists, appName + '.css exists').to.be.ok;
        });
    });

    // for backwards compat.
    it('app.scss is output to <app name>.css by default', function() {
      return copyFixtureFiles('brocfile-tests/multiple-sass-files')
        .then(function() {
          var brocfilePath = path.join(__dirname, '..', '..', 'tmp', appName, 'ember-cli-build.js');
          var brocfile = fs.readFileSync(brocfilePath, 'utf8');

          // remove custom preprocessCss paths, use app.scss instead
          brocfile = brocfile.replace(/outputPaths.*/, '');

          fs.writeFileSync(brocfilePath, brocfile, 'utf8');

          var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
          var packageJson = JSON.parse(fs.readFileSync(packageJsonPath, { encoding: 'utf8' }));
          packageJson.devDependencies['broccoli-sass'] = 'latest';

          return fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
        })
        .then(function() {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
        })
        .then(function() {
          var mainCSS = fs.readFileSync(path.join('.', 'dist', 'assets', appName + '.css'), {
            encoding: 'utf8'
          });

          expect(mainCSS).to.equal('body { background: green; }\n', appName + '.css contains correct content');
        });
    });
  });
  describe('preprocessor-smoke-test', function() {
    it('addons with standard preprocessors compile correctly', function() {
      return copyFixtureFiles('preprocessor-tests/app-with-addon-with-preprocessors')
        .then(function() {
          var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
          var packageJson = JSON.parse(fs.readFileSync(packageJsonPath, { encoding: 'utf8' }));
          packageJson.devDependencies['broccoli-sass'] = 'latest';
          packageJson.devDependencies['ember-cool-addon'] = 'latest';

          return fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
        })
        .then(function() {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
        })
        .then(function() {
          var mainCSS = fs.readFileSync(path.join('.', 'dist', 'assets', 'some-cool-app.css'), {
            encoding: 'utf8'
          });

          var vendorCSS = fs.readFileSync(path.join('.', 'dist', 'assets', 'vendor.css'), {
            encoding: 'utf8'
          });

          expect(mainCSS).to.contain('app styles included');
          expect(vendorCSS).to.contain('addon styles included');
        });
    });

    it('addon registry entries are added in the proper order', function() {
      return copyFixtureFiles('preprocessor-tests/app-registry-ordering')
        .then(function() {
          var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
          var packageJson = JSON.parse(fs.readFileSync(packageJsonPath, { encoding: 'utf8' }));
          packageJson.devDependencies['first-dummy-preprocessor'] = 'latest';
          packageJson.devDependencies['second-dummy-preprocessor'] = 'latest';

          return fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
        })
        .then(function() {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
        })
        .then(function() {
          var appJs = fs.readFileSync(path.join('.', 'dist', 'assets', 'some-cool-app.js'), {
            encoding: 'utf8'
          });

          expect(appJs).to.not.contain('__SECOND_PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should not be contained');
          expect(appJs).to.not.contain('__FIRST_PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should not be contained');
          expect(appJs).to.contain('replacedByPreprocessor', 'token should have been replaced in app bundle');
        });
    });

    it('addons without preprocessors compile correctly', function() {
      return copyFixtureFiles('preprocessor-tests/app-with-addon-without-preprocessors')
        .then(function() {
          var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
          var packageJson = JSON.parse(fs.readFileSync(packageJsonPath, { encoding: 'utf8' }));
          packageJson.devDependencies['broccoli-sass'] = 'latest';
          packageJson.devDependencies['ember-cool-addon'] = 'latest';

          return fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
        })
        .then(function() {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
        })
        .then(function() {
          var mainCSS = fs.readFileSync(path.join('.', 'dist', 'assets', 'some-cool-app.css'), {
            encoding: 'utf8'
          });

          var vendorCSS = fs.readFileSync(path.join('.', 'dist', 'assets', 'vendor.css'), {
            encoding: 'utf8'
          });

          expect(mainCSS).to.contain('app styles included');
          expect(vendorCSS).to.contain('addon styles included');
        });
    });

    /*
      [ app ]  -> [ addon ] -> [ preprocessor addon ]
        |             |
        |             |--- preprocessor applies to this
        |
        |-- preprocessor should not apply to this
    */
    it('addons depending on preprocessor addon preprocesses addon but not app', function() {
      return copyFixtureFiles('preprocessor-tests/app-with-addon-with-preprocessors-2')
        .then(function() {
          var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
          var packageJson = JSON.parse(fs.readFileSync(packageJsonPath, { encoding: 'utf8' }));
          packageJson.devDependencies['ember-cool-addon'] = 'latest';

          return fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
        })
        .then(function() {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
        })
        .then(function() {
          var appJs = fs.readFileSync(path.join('.', 'dist', 'assets', 'some-cool-app.js'), {
            encoding: 'utf8'
          });

          var vendorJs = fs.readFileSync(path.join('.', 'dist', 'assets', 'vendor.js'), {
            encoding: 'utf8'
          });

          expect(appJs).to.contain('__PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should not have been replaced in app bundle');
          expect(appJs).to.not.contain('replacedByPreprocessor', 'token should not have been replaced in app bundle');
          expect(vendorJs).to.not.contain('__PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should have been replaced in vendor bundle');
          expect(vendorJs).to.contain('replacedByPreprocessor', 'token should have been replaced in vendor bundle');
        });
    });

    /*
      [ app ]  -> [ addon ] ->  [ addon ] -> [ preprocessor addon ]
        |             |             |
        |             |             |--- preprocessor applies to this
        |             |
        |             |-- preprocessor should not apply to this
        |
        |-- preprocessor should not apply to this
    */
    it('addon N levels deep depending on preprocessor preprocesses that parent addon only', function() {
      return copyFixtureFiles('preprocessor-tests/app-with-addon-with-preprocessors-3')
        .then(function() {
          var packageJsonPath = path.join(__dirname, '..', '..', 'tmp', appName, 'package.json');
          var packageJson = JSON.parse(fs.readFileSync(packageJsonPath, { encoding: 'utf8' }));
          packageJson.devDependencies['ember-shallow-addon'] = 'latest';

          return fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
        })
        .then(function() {
          return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
        })
        .then(function() {
          var appJs = fs.readFileSync(path.join('.', 'dist', 'assets', 'some-cool-app.js'), {
            encoding: 'utf8'
          });

          var vendorJs = fs.readFileSync(path.join('.', 'dist', 'assets', 'vendor.js'), {
            encoding: 'utf8'
          });

          expect(appJs).to.contain('__PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should not have been replaced in app bundle');
          expect(appJs).to.not.contain('replacedByPreprocessor', 'token should not have been replaced in app bundle');
          expect(vendorJs).to.not.contain('deep: __PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should have been replaced in deep component');
          expect(vendorJs).to.contain('deep: "replacedByPreprocessor"', 'token should have been replaced in deep component');
          expect(vendorJs).to.contain('shallow: __PREPROCESSOR_REPLACEMENT_TOKEN__', 'token should not have been replaced in shallow component');
          expect(vendorJs).to.not.contain('shallow: "replacedByPreprocessor"', 'token should not have been replaced in shallow component');
        });
    });
  });
  /*
  describe('express-server-restart-test-app', function() {
    before(function() {
      process.chdir(appName);
      return copyFixtureFiles('restart-express-server/app-root');
    });
    function delay(ms) {
      return new Promise(function (resolve) {
        setTimeout(resolve, ms);
      });
    }
    function getRunCommandOptions(onChildSpawned) {
      return {
        onChildSpawned: onChildSpawned,
        killAfterChildSpawnedPromiseResolution: true
      };
    }

    var initialRoot = process.cwd();
    function ensureTestFileContents(expectedContents, message) {
      var contents = fs.readFileSync(path.join(initialRoot, 'tmp', appName, 'foo.txt'), { encoding: 'utf8' });
      expect(contents).to.equal(expectedContents, message);
    }

    function onChildSpawnedSingleCopy(copySrc, expectedContents) {
      return function() {
        process.chdir('server');
        return delay(6000)
          .then(function() {
            ensureTestFileContents('Initial contents of A.', 'Test file has correct contents after initial server start.');
            return copyFixtureFiles(path.join('restart-express-server', copySrc));
          }).then(function() {
            return delay(4000);
          }).then(function() {
            ensureTestFileContents(expectedContents, 'Test file has correct contents after first copy.');
          });
      };
    }

    function onChildSpawnedMultipleCopies() {
      return function() {
        process.chdir('server');
        return delay(6000)
          .then(function() {
            ensureTestFileContents('Initial contents of A.', 'Test file has correct contents after initial server start.');
            return copyFixtureFiles(path.join('restart-express-server', 'copy1'));
          }).then(function() {
            return delay(4000);
          }).then(function() {
            ensureTestFileContents('Copy1 contents of A.', 'Test file has correct contents after first copy.');
            return copyFixtureFiles(path.join('restart-express-server', 'copy2'));
          }).then(function() {
            return delay(4000);
          }).then(function() {
            ensureTestFileContents('Copy2 contents of A. Copy2 contents of B.', 'Test file has correct contents after second copy.');
            return remove(path.join('restart-express-server', 'subfolder'));
          }).then(function() {
            return copyFixtureFiles(path.join('restart-express-server', 'copy3'));
          }).then(function() {
            return delay(4000);
          }).then(function() {
            ensureTestFileContents('true true', 'Test file has correct contents after second copy.');
          });
      };
    }

    function runServer(commandOptions) {
      return new Promise(function(resolve, reject) {
        return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'),
          'serve',
          '--live-reload-port', '32580',
          '--port', '49741', commandOptions)
          .then(function() {
            throw new Error('The server should not have exited successfully.');
          })
          .catch(function(err) {
            if (err.testingError) {
              return reject(err.testingError);
            }

            // This error was just caused by us having to kill the program
            return resolve();
          });
      });
    }

    it('Server restarts successfully on copy1', function() {
      this.timeout(30000);

      ensureTestFileContents('Initial Contents\n', 'Test file initialized properly.');
      return runServer(getRunCommandOptions(onChildSpawnedSingleCopy('copy1', 'Copy1 contents of A.')));
    });

    it('Server restarts successfully on copy2', function() {
      this.timeout(30000);

      ensureTestFileContents('Initial Contents\n', 'Test file initialized properly.');
      return runServer(getRunCommandOptions(onChildSpawnedSingleCopy('copy2', 'Copy2 contents of A. Copy2 contents of B.')));
    });

    it('Server restarts successfully on multiple copies', function() {
      this.timeout(90000);

      ensureTestFileContents('Initial Contents\n', 'Test file initialized properly.');
      return runServer(getRunCommandOptions(onChildSpawnedMultipleCopies()));
    });
  });
  */
});
