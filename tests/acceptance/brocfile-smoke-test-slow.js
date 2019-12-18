'use strict';

const RSVP = require('rsvp');
const path = require('path');
const fs = require('fs-extra');
let remove = RSVP.denodeify(fs.remove);

const { isExperimentEnabled } = require('../../lib/experiments');
const runCommand = require('../helpers/run-command');
const acceptance = require('../helpers/acceptance');
const copyFixtureFiles = require('../helpers/copy-fixture-files');
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

describe('Acceptance: brocfile-smoke-test', function() {
  this.timeout(500000);

  before(function() {
    return createTestTargets(appName);
  });

  after(teardownTestTargets);

  beforeEach(function() {
    appRoot = linkDependencies(appName);
  });

  afterEach(function() {
    cleanupRun(appName);
    expect(dir(appRoot)).to.not.exist;
  });

  if (!isExperimentEnabled('MODULE_UNIFICATION')) {
    it('a custom EmberENV in config/environment.js is used for window.EmberENV', async function() {
      await copyFixtureFiles('brocfile-tests/custom-ember-env');
      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      let vendorContents = fs.readFileSync(path.join('dist', 'assets', 'vendor.js'), {
        encoding: 'utf8',
      });

      // Changes in config/optional-features.json end up being set in EmberENV
      let expected =
        '(window.EmberENV || {}, {"asdflkmawejf":";jlnu3yr23","_APPLICATION_TEMPLATE_WRAPPER":false,"_DEFAULT_ASYNC_OBSERVERS":true,"_JQUERY_INTEGRATION":false,"_TEMPLATE_ONLY_GLIMMER_COMPONENTS":true});';
      expect(vendorContents).to.contain(expected, 'EmberENV should be in assets/vendor.js');
    });

    it('a custom environment config can be used in Brocfile.js', async function() {
      await copyFixtureFiles('brocfile-tests/custom-environment-config');
      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
    });

    it('without app/templates', async function() {
      await copyFixtureFiles('brocfile-tests/pods-templates');
      await remove(path.join(process.cwd(), 'app/templates'));
      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
    });

    it('strips app/styles or app/templates from JS', async function() {
      await copyFixtureFiles('brocfile-tests/styles-and-templates-stripped');
      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      let appFileContents = fs.readFileSync(path.join(appRoot, 'dist', 'assets', `${appName}.js`), {
        encoding: 'utf8',
      });

      expect(appFileContents).to.include('//app/templates-stuff.js');
      expect(appFileContents).to.include('//app/styles-manager.js');
    });

    it('should throw if no build file is found', async function() {
      fs.removeSync('./ember-cli-build.js');
      try {
        await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      } catch (err) {
        expect(err.code).to.eql(1);
      }
    });

    it('using autoRun: true', async function() {
      await copyFixtureFiles('brocfile-tests/auto-run-true');
      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      let appFileContents = fs.readFileSync(path.join(appRoot, 'dist', 'assets', `${appName}.js`), {
        encoding: 'utf8',
      });
      expect(appFileContents).to.match(/\/app"\)\["default"\]\.create\(/);
    });

    it('using autoRun: false', async function() {
      await copyFixtureFiles('brocfile-tests/auto-run-false');
      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      let appFileContents = fs.readFileSync(path.join(appRoot, 'dist', 'assets', `${appName}.js`), {
        encoding: 'utf8',
      });

      expect(appFileContents).to.not.match(/\/app"\)\["default"\]\.create\(/);
    });

    it('app.import works properly with test tree files', async function() {
      await copyFixtureFiles('brocfile-tests/app-test-import');

      let packageJsonPath = path.join(appRoot, 'package.json');
      let packageJson = fs.readJsonSync(packageJsonPath);
      packageJson.devDependencies['ember-test-addon'] = 'latest';
      fs.writeJsonSync(packageJsonPath, packageJson);

      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      let subjectFileContents = fs.readFileSync(path.join(appRoot, 'dist', 'assets', 'test-support.js'), {
        encoding: 'utf8',
      });

      expect(subjectFileContents).to.contain('// File for test tree imported and added via postprocessTree()');
    });

    it('app.import works properly with non-js/css files', async function() {
      await copyFixtureFiles('brocfile-tests/app-import');

      let packageJsonPath = path.join(appRoot, 'package.json');
      let packageJson = fs.readJsonSync(packageJsonPath);
      packageJson.devDependencies['ember-random-addon'] = 'latest';
      fs.writeJsonSync(packageJsonPath, packageJson);

      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      let subjectFileContents = fs.readFileSync(path.join(appRoot, 'dist', 'assets', 'file-to-import.txt'), {
        encoding: 'utf8',
      });

      expect(subjectFileContents).to.equal('EXAMPLE TEXT FILE CONTENT\n');
    });

    it('addons can have a public tree that is merged and returned namespaced by default', async function() {
      await copyFixtureFiles('brocfile-tests/public-tree');

      let packageJsonPath = path.join(appRoot, 'package.json');
      let packageJson = fs.readJsonSync(packageJsonPath);
      packageJson.devDependencies['ember-random-addon'] = 'latest';
      fs.writeJsonSync(packageJsonPath, packageJson);

      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      let subjectFileContents = fs.readFileSync(
        path.join(appRoot, 'dist', 'ember-random-addon', 'some-root-file.txt'),
        {
          encoding: 'utf8',
        }
      );

      expect(subjectFileContents).to.equal('ROOT FILE\n');
    });

    it('using pods based templates', async function() {
      await copyFixtureFiles('brocfile-tests/pods-templates');
      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
    });

    it('using pods based templates with a podModulePrefix', async function() {
      await copyFixtureFiles('brocfile-tests/pods-with-prefix-templates');
      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
    });

    it('addon trees are not jshinted', async function() {
      await copyFixtureFiles('brocfile-tests/jshint-addon');

      let packageJsonPath = path.join(appRoot, 'package.json');
      let packageJson = fs.readJsonSync(packageJsonPath);
      packageJson['ember-addon'] = {
        paths: ['./lib/ember-random-thing'],
      };
      fs.writeJsonSync(packageJsonPath, packageJson);

      let ember = path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember');

      let error = await expect(runCommand(ember, 'test', '--filter=jshint')).to.eventually.be.rejected;

      expect(error.output.join('')).to.include('Error: No tests matched the filter "jshint"');
    });

    it('multiple css files in styles/ are output when a preprocessor is not used', async function() {
      await copyFixtureFiles('brocfile-tests/multiple-css-files');

      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      let files = ['/assets/some-cool-app.css', '/assets/other.css'];

      let basePath = path.join(appRoot, 'dist');
      files.forEach(function(f) {
        expect(file(path.join(basePath, f))).to.exist;
      });
    });

    it('specifying custom output paths works properly', async function() {
      await copyFixtureFiles('brocfile-tests/custom-output-paths');

      let themeCSSPath = path.join(appRoot, 'app', 'styles', 'theme.css');
      fs.writeFileSync(themeCSSPath, 'html, body { margin: 20%; }');

      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      let files = [
        '/css/app.css',
        '/css/theme/a.css',
        '/js/app.js',
        '/css/vendor.css',
        '/js/vendor.js',
        '/css/test-support.css',
        '/js/test-support.js',
        '/my-app.html',
      ];

      let basePath = path.join(appRoot, 'dist');
      files.forEach(function(f) {
        expect(file(path.join(basePath, f))).to.exist;
      });
    });

    it('specifying outputFile results in an explicitly generated assets', async function() {
      await copyFixtureFiles('brocfile-tests/app-import-output-file');
      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      let files = ['/assets/output-file.js', '/assets/output-file.css', '/assets/vendor.css', '/assets/vendor.js'];

      let basePath = path.join(appRoot, 'dist');
      files.forEach(function(f) {
        expect(file(path.join(basePath, f))).to.exist;
      });
    });

    it('can use transformation to turn anonymous AMD into named AMD', async function() {
      await copyFixtureFiles('brocfile-tests/app-import-anonymous-amd');
      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      let outputJS = fs.readFileSync(path.join(appRoot, 'dist', 'assets', 'output.js'), {
        encoding: 'utf8',
      });

      (function() {
        let defineCount = 0;
        // eslint-disable-next-line no-unused-vars
        function define(name, deps, factory) {
          expect(name).to.equal('hello-world');
          expect(deps).to.deep.equal([]);
          expect(factory()()).to.equal('Hello World');
          defineCount++;
        }
        /* eslint-disable no-eval */
        eval(outputJS);
        /* eslint-enable no-eval */
        expect(defineCount).to.eql(1);
      })();
    });

    it('can do amd transform from addon', async function() {
      await copyFixtureFiles('brocfile-tests/app-import-custom-transform');

      let packageJsonPath = path.join(appRoot, 'package.json');
      let packageJson = fs.readJsonSync(packageJsonPath);
      packageJson.devDependencies['ember-transform-addon'] = 'latest';
      fs.writeJsonSync(packageJsonPath, packageJson);

      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      let addonOutputJs = fs.readFileSync(path.join(appRoot, 'dist', 'assets', 'addon-output.js'), {
        encoding: 'utf8',
      });

      (function() {
        let defineCount = 0;
        // eslint-disable-next-line no-unused-vars
        function define(name, deps, factory) {
          expect(name).to.equal('addon-vendor');
          expect(deps).to.deep.equal([]);
          expect(factory()()).to.equal('Hello World');
          defineCount++;
        }
        /* eslint-disable no-eval */
        eval(addonOutputJs);
        /* eslint-enable no-eval */
        expect(defineCount).to.eql(1);
      })();
    });

    it('can use transformation to turn library into custom transformation', async function() {
      await copyFixtureFiles('brocfile-tests/app-import-custom-transform');

      let packageJsonPath = path.join(appRoot, 'package.json');
      let packageJson = fs.readJsonSync(packageJsonPath);
      packageJson.devDependencies['ember-transform-addon'] = 'latest';
      fs.writeJsonSync(packageJsonPath, packageJson);

      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      let outputJS = fs.readFileSync(path.join(appRoot, 'dist', 'assets', 'output.js'), {
        encoding: 'utf8',
      });

      expect(outputJS).to.be.equal(
        'if (typeof FastBoot === \'undefined\') { window.hello = "hello world"; }//# sourceMappingURL=output.map\n'
      );
    });

    // skipped because of potentially broken assertion that should be fixed correctly at a later point
    it.skip('specifying partial `outputPaths` hash deep merges options correctly', async function() {
      await copyFixtureFiles('brocfile-tests/custom-output-paths');

      let themeCSSPath = path.join(appRoot, 'app', 'styles', 'theme.css');
      fs.writeFileSync(themeCSSPath, 'html, body { margin: 20%; }');

      let brocfilePath = path.join(appRoot, 'ember-cli-build.js');
      let brocfile = fs.readFileSync(brocfilePath, 'utf8');

      // remove outputPaths.app.js option
      brocfile = brocfile.replace(/js: '\/js\/app.js'/, '');
      // remove outputPaths.app.css.app option
      brocfile = brocfile.replace(/'app': '\/css\/app\.css',/, '');

      fs.writeFileSync(brocfilePath, brocfile, 'utf8');

      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      let files = [
        '/css/theme/a.css',
        '/assets/some-cool-app.js',
        '/css/vendor.css',
        '/js/vendor.js',
        '/css/test-support.css',
        '/js/test-support.js',
      ];

      let basePath = path.join(appRoot, 'dist');
      files.forEach(function(f) {
        expect(file(path.join(basePath, f))).to.exist;
      });

      expect(file(path.join(basePath, '/assets/some-cool-app.css'))).to.not.exist;
    });

    it('multiple paths can be CSS preprocessed', async function() {
      await copyFixtureFiles('brocfile-tests/multiple-sass-files');

      let packageJsonPath = path.join(appRoot, 'package.json');
      let packageJson = fs.readJsonSync(packageJsonPath);
      packageJson.devDependencies['ember-cli-sass'] = 'latest';
      fs.writeJsonSync(packageJsonPath, packageJson);

      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      expect(file('dist/assets/main.css')).to.equal(
        'body { background: black; }\n',
        'main.css contains correct content'
      );

      expect(file('dist/assets/theme/a.css')).to.equal(
        '.theme { color: red; }\n',
        'theme/a.css contains correct content'
      );
    });

    it('app.css is output to <app name>.css by default', async function() {
      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
      expect(file(`dist/assets/${appName}.css`)).to.exist;
    });

    // for backwards compat.
    it('app.scss is output to <app name>.css by default', async function() {
      await copyFixtureFiles('brocfile-tests/multiple-sass-files');

      let brocfilePath = path.join(appRoot, 'ember-cli-build.js');
      let brocfile = fs.readFileSync(brocfilePath, 'utf8');

      // remove custom preprocessCss paths, use app.scss instead
      brocfile = brocfile.replace(/outputPaths.*/, '');

      fs.writeFileSync(brocfilePath, brocfile, 'utf8');

      let packageJsonPath = path.join(appRoot, 'package.json');
      let packageJson = fs.readJsonSync(packageJsonPath);
      packageJson.devDependencies['ember-cli-sass'] = 'latest';
      fs.writeJsonSync(packageJsonPath, packageJson);

      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      expect(file(`dist/assets/${appName}.css`)).to.equal('body { background: green; }\n');
    });

    it('additional trees can be passed to the app', async function() {
      await copyFixtureFiles('brocfile-tests/additional-trees');
      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', { verbose: true });

      let files = [
        '/assets/custom-output-file.js',
        '/assets/custom-output-file.css',
        '/assets/vendor.css',
        '/assets/vendor.js',
      ];

      let basePath = path.join(appRoot, 'dist');
      files.forEach(function(f) {
        expect(file(path.join(basePath, f))).to.exist;
      });
    });
  }
});
