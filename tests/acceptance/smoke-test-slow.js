'use strict';

const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const walkSync = require('walk-sync');
const EOL = require('os').EOL;

const runCommand = require('../helpers/run-command');
const acceptance = require('../helpers/acceptance');
const copyFixtureFiles = require('../helpers/copy-fixture-files');
const killCliProcess = require('../helpers/kill-cli-process');
const ember = require('../helpers/ember');
const experiments = require('../../lib/experiments/');
let createTestTargets = acceptance.createTestTargets;
let teardownTestTargets = acceptance.teardownTestTargets;
let linkDependencies = acceptance.linkDependencies;
let cleanupRun = acceptance.cleanupRun;

const chai = require('../chai');
let expect = chai.expect;
let file = chai.file;
let dir = chai.dir;

let appName = 'some-cool-app';
let appRoot;

describe('Acceptance: smoke-test', function() {
  this.timeout(500000);
  before(function() {
    return createTestTargets(appName, { createESLintConfig: true });
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
        let templatePath = path.join('lib', 'my-addon', 'app', 'templates', 'foo.hbs');
        fs.mkdirsSync(path.dirname(templatePath));
        fs.writeFileSync(templatePath, 'Hi, Mom!', { encoding: 'utf8' });
      })
      .then(function() {
        let packageJsonPath = path.join('lib', 'my-addon', 'package.json');
        let packageJson = fs.readJsonSync(packageJsonPath);
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
        let dirPath = path.join(appRoot, 'dist', 'assets');
        let dir = fs.readdirSync(dirPath);
        let files = [];

        dir.forEach(function(filepath) {
          if (filepath === '.gitkeep') {
            return;
          }

          files.push(filepath);

          let file = fs.readFileSync(path.join(dirPath, filepath), { encoding: null });

          let md5 = crypto.createHash('md5');
          md5.update(file);
          let hex = md5.digest('hex');

          expect(filepath).to.contain(hex, `${filepath} contains the fingerprint (${hex})`);
        });

        let indexHtml = file('dist/index.html');
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
        let exitCode = result.code;
        let output = result.output.join(EOL);

        expect(exitCode).to.equal(0, 'exit code should be 0 for passing tests');
        expect(output).to.match(/JSHint/, 'JSHint should be run on production assets');
        expect(output).to.match(/fail\s+0/, 'no failures');
        expect(output).to.match(/pass\s+\d+/, 'man=y passing');
      });
  });

  it('ember test --path with previous build', function() {
    let originalWrite = process.stdout.write;
    let output = [];

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
        expect(output).to.match(/pass\s+12/, '12 passing');
      });
  });

  it('ember new foo, build development, and verify generated files', function() {
    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build')
      .then(function() {
        let dirPath = path.join(appRoot, 'dist');
        let paths = walkSync(dirPath);

        expect(paths).to.have.length.below(24, `expected fewer than 24 files in dist, found ${paths.length}`);
      });
  });

  it('ember build exits with non-zero code when build fails', function() {
    let appJsPath = path.join(appRoot, 'app', 'app.js');
    let ouputContainsBuildFailed = false;

    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build').then(function(result) {
      expect(result.code).to.equal(0, `expected exit code to be zero, but got ${result.code}`);

      // add something broken to the project to make build fail
      fs.appendFileSync(appJsPath, '{(syntaxError>$@}{');

      return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', {
        onOutput(string) {
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
      expect(result.code).to.not.equal(0, `expected exit code to be non-zero, but got ${result.code}`);
    });
  });


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

        let json = fs.readJsonSync(instrumentationFile);
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

  it('ember new foo, build --watch development, and verify rebuilt after change', function() {
    let touched = false;
    let appJsPath = path.join(appRoot, 'app', 'app.js');
    let builtJsPath = path.join(appRoot, 'dist', 'assets', 'some-cool-app.js');
    let text = 'anotuhaonteuhanothunaothanoteh';
    let line = `console.log("${text}");`;

    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--watch', {
      onOutput(string, child) {
        if (touched) {
          if (string.match(/Build successful/)) {
            // build after change to app.js
            let contents = fs.readFileSync(builtJsPath).toString();
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
    let buildCount = 0;
    let touched = false;
    let appJsPath = path.join(appRoot, 'app', 'app.js');
    let builtJsPath = path.join(appRoot, 'dist', 'assets', 'some-cool-app.js');
    let firstText = 'anotuhaonteuhanothunaothanoteh';
    let firstLine = `console.log("${firstText}");`;
    let secondText = 'aahsldfjlwioruoiiononociwewqwr';
    let secondLine = `console.log("${secondText}");`;

    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--watch', {
      onOutput(string, child) {
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
            let contents = fs.readFileSync(builtJsPath).toString();
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
      onOutput(string, child) {
        if (string.match(/Build successful/)) {
          killCliProcess(child);
        }
      },
    })
    .then(result => {
      let dirPath = path.join(appRoot, 'tmp');
      let dir = fs.readdirSync(dirPath);

      expect(result.code, 'should be zero exit code').to.equal(0);
      expect(dir.length, '/tmp should be empty').to.equal(0);
    })
    .catch(function(result) {
      expect(false, 'should not be rejected').to.equal(true);
    });
  });

  it('ember new foo, test, SIGINT exits with error and clears tmp/', function() {
    return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test', '--test-port=25522', {
      onOutput(string, child) {
        // wait for the first passed test and then exit
        if (string.match(/^ok\ /)) {
          killCliProcess(child);
        }
      },
    }).then(() => {
      expect(false, 'should not be resolved').to.equal(true);
    }).catch(result => {
      let dirPath = path.join(appRoot, 'tmp');
      let dir = fs.readdirSync(dirPath);

      expect(result.code, 'should be error exit code').to.not.equal(0);
      expect(dir.length, '/tmp should be empty').to.equal(0);
    });
  });

  it('ember new foo, build production and verify css files are concatenated', function() {
    return copyFixtureFiles('with-styles').then(function() {
      return runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--environment=production')
        .then(function() {
          let dirPath = path.join(appRoot, 'dist', 'assets');
          let dir = fs.readdirSync(dirPath);
          let cssNameRE = new RegExp(`${appName}-([a-f0-9]+)\\.css`, 'i');
          dir.forEach(function(filepath) {
            if (cssNameRE.test(filepath)) {
              expect(file(`dist/assets/${filepath}`))
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
        let dirPath = path.join(appRoot, 'dist', 'assets');
        let dir = fs.readdirSync(dirPath);
        let appNameRE = new RegExp(`${appName}-([a-f0-9]+)\\.js`, 'i');
        dir.forEach(function(filepath) {
          if (appNameRE.test(filepath)) {
            let contents = fs.readFileSync(path.join(appRoot, 'dist', 'assets', filepath), { encoding: 'utf8' });
            let count = (contents.match(/(["'])use strict\1;/g) || []).length;
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
        let packageJsonPath = 'package.json';
        let packageJson = fs.readJsonSync(packageJsonPath);
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
            let output = result.output.join(EOL);
            expect(output).to.match(/TemplateLint:/, 'ran template linter');
            expect(output).to.match(/fail\s+2/, 'two templates failed linting');
            expect(result.code).to.equal(1);
          });
      });
  });
});
