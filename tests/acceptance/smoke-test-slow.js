'use strict';

const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const walkSync = require('walk-sync');
const EOL = require('os').EOL;

const { isExperimentEnabled } = require('../../lib/experiments');
const runCommand = require('../helpers/run-command');
const acceptance = require('../helpers/acceptance');
const copyFixtureFiles = require('../helpers/copy-fixture-files');
const killCliProcess = require('../helpers/kill-cli-process');
const ember = require('../helpers/ember');
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

  if (!isExperimentEnabled('MODULE_UNIFICATION')) {
    it('ember new foo, make sure addon template overwrites', async function() {
      await ember(['generate', 'template', 'foo']);
      await ember(['generate', 'in-repo-addon', 'my-addon']);

      // this should work, but generating a template in an addon/in-repo-addon doesn't
      // do the right thing: update once https://github.com/ember-cli/ember-cli/issues/5687
      // is fixed
      //return ember(['generate', 'template', 'foo', '--in-repo-addon=my-addon']);

      // temporary work around
      let templatePath = path.join('lib', 'my-addon', 'app', 'templates', 'foo.hbs');
      let packageJsonPath = path.join('lib', 'my-addon', 'package.json');

      fs.mkdirsSync(path.dirname(templatePath));
      fs.writeFileSync(templatePath, 'Hi, Mom!', { encoding: 'utf8' });

      let packageJson = fs.readJsonSync(packageJsonPath);
      packageJson.dependencies = packageJson.dependencies || {};
      packageJson.dependencies['ember-cli-htmlbars'] = '*';

      fs.writeJsonSync(packageJsonPath, packageJson);

      let result = await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      expect(result.code).to.equal(0);
    });

    it('ember test still runs when a JavaScript testem config exists', async function() {
      await copyFixtureFiles('smoke-tests/js-testem-config');

      let result = await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');

      let exitCode = result.code;
      let output = result.output.join(EOL);

      expect(exitCode).to.eql(0);
      expect(output).to.include('***CUSTOM_TESTEM_JS**');
    });

    it('eslint passes after running ember new', async function() {
      let result = await runCommand(path.join('.', 'node_modules', 'eslint', 'bin', 'eslint.js'), appRoot);

      let exitCode = result.code;

      expect(exitCode).to.equal(0, 'exit code should be 0 for passing tests');
      expect(result.output).to.be.empty;
    });

    // there is a bug in here when running the entire suite on Travis
    // when run in isolation, it passes
    // here is the error:
    // test-support-80f2fe63fae0c44478fe0f8af73200a7.js contains the fingerprint (2871106928f813936fdd64f4d16005ac): expected 'test-support-80f2fe63fae0c44478fe0f8af73200a7.js' to include '2871106928f813936fdd64f4d16005ac'
    it.skip('ember new foo, build production and verify fingerprint', async function() {
      await runCommand(
        path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'),
        'build',
        '--environment=production'
      );

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

    it('ember test --environment=production', async function() {
      await copyFixtureFiles('smoke-tests/passing-test');

      let result = await runCommand(
        path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'),
        'test',
        '--environment=production'
      );

      let exitCode = result.code;
      let output = result.output.join(EOL);

      expect(exitCode).to.equal(0, 'exit code should be 0 for passing tests');
      expect(output).to.match(/ESLint/, 'ESLint should be run on production assets');
      expect(output).to.match(/fail\s+0/, 'no failures');
      expect(output).to.match(/pass\s+\d+/, 'many passing');
    });

    it('ember test --path with previous build', async function() {
      let originalWrite = process.stdout.write;
      let output = [];

      await copyFixtureFiles('smoke-tests/passing-test');

      // TODO: Change to using ember() helper once it properly saves build artifacts
      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      // TODO: Figure out how to get this to write into the MockUI
      process.stdout.write = (function() {
        return function() {
          output.push(arguments[0]);
        };
      })(originalWrite);

      let result;
      try {
        result = await ember(['test', '--path=dist']);
      } finally {
        process.stdout.write = originalWrite;
      }

      expect(result.exitCode).to.equal(0, 'exit code should be 0 for passing tests');

      output = output.join(EOL);

      expect(output).to.match(/fail\s+0/, 'no failures');
      expect(output).to.match(/pass\s+\d+/, 'many passing');
    });

    it('ember test wasm', async function() {
      let originalWrite = process.stdout.write;
      let output = [];

      await copyFixtureFiles('smoke-tests/serve-wasm');

      // TODO: Change to using ember() helper once it properly saves build artifacts
      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      // TODO: Figure out how to get this to write into the MockUI
      process.stdout.write = (function() {
        return function() {
          output.push(arguments[0]);
        };
      })(originalWrite);

      let result;
      try {
        result = await ember(['test', '--path=dist']);
      } finally {
        process.stdout.write = originalWrite;
      }

      expect(result.exitCode).to.equal(0, 'exit code should be 0 for passing tests');

      output = output.join(EOL);

      expect(output).to.match(/fail\s+0/, 'no failures');
      expect(output).to.match(/pass\s+\d+/, 'many passing');
    });

    it('ember new foo, build development, and verify generated files', async function() {
      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      let dirPath = path.join(appRoot, 'dist');
      let paths = walkSync(dirPath);

      expect(paths).to.have.length.below(24, `expected fewer than 24 files in dist, found ${paths.length}`);
    });

    it('ember build exits with non-zero code when build fails', async function() {
      let appJsPath = path.join(appRoot, 'app', 'app.js');

      let result = await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      expect(result.code).to.equal(0, `expected exit code to be zero, but got ${result.code}`);

      // add something broken to the project to make build fail
      fs.appendFileSync(appJsPath, '{(syntaxError>$@}{');

      result = await expect(runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build')).to.be
        .rejected;

      expect(result.code).to.not.equal(0, `expected exit code to be non-zero, but got ${result.code}`);
    });

    it('ember build generates instrumentation files when viz is enabled', async function() {
      process.env.BROCCOLI_VIZ = '1';

      try {
        await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', {
          env: {
            BROCCOLI_VIZ: '1',
          },
        });
      } finally {
        delete process.env.BROCCOLI_VIZ;
      }

      [
        'instrumentation.build.0.json',
        'instrumentation.command.json',
        'instrumentation.init.json',
        'instrumentation.shutdown.json',
      ].forEach(instrumentationFile => {
        expect(fs.existsSync(instrumentationFile)).to.equal(true);

        let json = fs.readJsonSync(instrumentationFile);
        expect(Object.keys(json)).to.eql(['summary', 'nodes']);

        expect(Array.isArray(json.nodes)).to.equal(true);
      });
    });

    it.skip('ember new foo, build --watch development, and verify rebuilt after change', async function() {
      let touched = false;
      let appJsPath = path.join(appRoot, 'app', 'app.js');
      let builtJsPath = path.join(appRoot, 'dist', 'assets', 'some-cool-app.js');
      let text = 'anotuhaonteuhanothunaothanoteh';
      let line = `console.log("${text}");`;

      try {
        await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--watch', {
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
        });
      } catch (error) {
        // swallowing because of SIGINT
      }
    });

    it.skip('ember new foo, build --watch development, and verify rebuilt after multiple changes', async function() {
      let buildCount = 0;
      let touched = false;
      let appJsPath = path.join(appRoot, 'app', 'app.js');
      let builtJsPath = path.join(appRoot, 'dist', 'assets', 'some-cool-app.js');
      let firstText = 'anotuhaonteuhanothunaothanoteh';
      let firstLine = `console.log("${firstText}");`;
      let secondText = 'aahsldfjlwioruoiiononociwewqwr';
      let secondLine = `console.log("${secondText}");`;

      try {
        await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', '--watch', {
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
        });
      } catch (error) {
        // swallowing because of SIGINT
      }
    });

    it.skip('ember new foo, server, SIGINT clears tmp/', async function() {
      let result = await runCommand(
        path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'),
        'server',
        '--port=54323',
        '--live-reload=false',
        {
          onOutput(string, child) {
            if (string.match(/Build successful/)) {
              killCliProcess(child);
            }
          },
        }
      );

      expect(result.code, 'should be zero exit code').to.equal(0);

      let dirPath = path.join(appRoot, 'tmp');

      // before broccoli2, various addons used tmp/ in the project.
      // With broccoli2 that should not exist, they should be using os.tmpdir().
      // So we'll just check for "if tmp/ is there, are the contents correct?"
      if (fs.existsSync(dirPath)) {
        let dir = fs.readdirSync(dirPath).filter(file => file !== '.metadata_never_index');
        expect(dir.length, `${dirPath} should be empty`).to.equal(0);
      }
    });

    it('ember new foo, test, SIGINT exits with error and clears tmp/', async function() {
      let result = await expect(
        runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test', '--test-port=25522', {
          onOutput(string, child) {
            // wait for the first passed test and then exit
            if (string.match(/^ok /)) {
              killCliProcess(child);
            }
          },
        })
      ).to.be.rejected;

      expect(result.code, 'should be error exit code').to.not.equal(0);

      let dirPath = path.join(appRoot, 'tmp');

      // before broccoli2, various addons used tmp/ in the project.
      // With broccoli2 that should not exist, they should be using os.tmpdir().
      // So we'll just check for "if tmp/ is there, are the contents correct?"
      if (fs.existsSync(dirPath)) {
        let dir = fs.readdirSync(dirPath).filter(file => file !== '.metadata_never_index');
        expect(dir.length, `${dirPath} should be empty`).to.equal(0);
      }
    });

    it('ember new foo, build production and verify css files are concatenated', async function() {
      await copyFixtureFiles('with-styles');

      await runCommand(
        path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'),
        'build',
        '--environment=production'
      );

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

    it('ember new foo, build production and verify css files are minified', async function() {
      await copyFixtureFiles('with-unminified-styles');

      await runCommand(
        path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'),
        'build',
        '--environment=production'
      );

      let dirPath = path.join(appRoot, 'dist', 'assets');
      let dir = fs.readdirSync(dirPath);
      let cssNameRE = new RegExp(`${appName}-([a-f0-9]+)\\.css`, 'i');
      dir.forEach(function(filepath) {
        if (cssNameRE.test(filepath)) {
          let contents = fs.readFileSync(path.join(appRoot, 'dist', 'assets', filepath), { encoding: 'utf8' });
          expect(contents).to.match(/^\S+$/, 'css file is minified');
        }
      });
    });

    it('ember new foo, build production and verify single "use strict";', async function() {
      await runCommand(
        path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'),
        'build',
        '--environment=production'
      );

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

    it('ember can override and reuse the built-in blueprints', async function() {
      await copyFixtureFiles('addon/with-blueprint-override');

      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'generate', 'component', 'foo-bar');

      let filePath = 'app/components/new-path/foo-bar.js';

      // because we're overriding, the fileMapTokens is default, sans 'component'
      expect(file(filePath)).to.contain('generated component successfully');
    });

    it('template linting works properly for pods and classic structured templates', async function() {
      await copyFixtureFiles('smoke-tests/with-template-failing-linting');

      let packageJsonPath = 'package.json';
      let packageJson = fs.readJsonSync(packageJsonPath);
      packageJson.devDependencies = packageJson.devDependencies || {};
      packageJson.devDependencies['fake-template-linter'] = 'latest';
      fs.writeJsonSync(packageJsonPath, packageJson);

      let result = await expect(runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test')).to.be
        .rejected;

      let output = result.output.join(EOL);
      expect(output).to.match(/TemplateLint:/, 'ran template linter');
      expect(output).to.match(/fail\s+2/, 'two templates failed linting');
      expect(result.code).to.equal(1);
    });
  }
});
