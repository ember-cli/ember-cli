'use strict';

const path = require('path');
const fs = require('fs-extra');

const { isExperimentEnabled } = require('../../lib/experiments');
const runCommand = require('../helpers/run-command');
const acceptance = require('../helpers/acceptance');
const copyFixtureFiles = require('../helpers/copy-fixture-files');
const DistChecker = require('../helpers/dist-checker');
let createTestTargets = acceptance.createTestTargets;
let teardownTestTargets = acceptance.teardownTestTargets;
let linkDependencies = acceptance.linkDependencies;
let cleanupRun = acceptance.cleanupRun;

const { expect } = require('chai');
const { dir, file } = require('chai-files');

let appName = 'some-cool-app';
let appRoot;

describe('Acceptance: brocfile-smoke-test', function () {
  this.timeout(500000);

  before(function () {
    return createTestTargets(appName);
  });

  after(teardownTestTargets);

  beforeEach(function () {
    appRoot = linkDependencies(appName);
  });

  afterEach(function () {
    runCommand.killAll();
    cleanupRun(appName);
    expect(dir(appRoot)).to.not.exist;
  });

  it('a custom EmberENV in config/environment.js is used for window.EmberENV', async function () {
    await copyFixtureFiles('brocfile-tests/custom-ember-env');
    await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

    let checker = new DistChecker(path.join(appRoot, 'dist'));
    await checker.evalScripts();
    let { window } = checker;

    // Changes in config/optional-features.json end up being set in EmberENV
    expect(window.EmberENV.asdflkmawejf).to.eql(';jlnu3yr23');
    expect(window.EmberENV._APPLICATION_TEMPLATE_WRAPPER).to.be.false;
    expect(window.EmberENV._DEFAULT_ASYNC_OBSERVERS).to.be.true;
    expect(window.EmberENV._JQUERY_INTEGRATION).to.be.false;
    expect(window.EmberENV._TEMPLATE_ONLY_GLIMMER_COMPONENTS).to.be.true;
  });

  it('a custom environment config can be used in Brocfile.js', async function () {
    await copyFixtureFiles('brocfile-tests/custom-environment-config');
    await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
  });

  it('builds with an ES modules ember-cli-build.js', async function () {
    await fs.writeFile(
      'ember-cli-build.js',
      `
      import EmberApp from 'ember-cli/lib/broccoli/ember-app.js';

      export default async function (defaults) {
        const app = new EmberApp(defaults, { });

        return app.toTree();
      };
    `
    );

    let appPackageJson = await fs.readJson('package.json');
    appPackageJson.type = 'module';
    await fs.writeJson('package.json', appPackageJson);

    // lib/utilities/find-build-file.js uses await import and so can handle ES module ember-cli-build.js
    //
    // However, broccoli-config-loader uses require, so files like
    // config/environment.js must be in commonjs format. The way to mix ES and
    // commonjs formats in node is with multiple `package.json`s
    await fs.writeJson('config/package.json', { type: 'commonjs' });
    console.log(process.cwd());
    await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
  });

  it('without app/templates', async function () {
    await copyFixtureFiles('brocfile-tests/pods-templates');
    await fs.remove(path.join(process.cwd(), 'app/templates'));
    await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
  });

  it('strips app/styles or app/templates from JS', async function () {
    await copyFixtureFiles('brocfile-tests/styles-and-templates-stripped');
    await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

    let checker = new DistChecker(path.join(appRoot, 'dist'));

    expect(checker.contains('js', '//app/templates-stuff.js')).to.be;
    expect(checker.contains('js', '//app/styles-manager.js')).to.be;
  });

  it('should throw if no build file is found', async function () {
    fs.removeSync('./ember-cli-build.js');
    try {
      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
    } catch (err) {
      expect(err.code).to.eql(1);
    }
  });

  it('using autoRun: true', async function () {
    await copyFixtureFiles('brocfile-tests/auto-run-true');
    await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

    let checker = new DistChecker(path.join(appRoot, 'dist'));
    await checker.evalScripts();

    let { window } = checker;

    expect(window.APP_HAS_LOADED).to.be.true;
  });

  it('using autoRun: false', async function () {
    await copyFixtureFiles('brocfile-tests/auto-run-false');
    await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

    let checker = new DistChecker(path.join(appRoot, 'dist'));
    await checker.evalScripts();

    let { window } = checker;

    expect(window.APP_HAS_LOADED).to.be.undefined;
  });

  // we dont run postprocessTree in embroider
  if (!isExperimentEnabled('EMBROIDER')) {
    it('app.import works properly with test tree files', async function () {
      await copyFixtureFiles('brocfile-tests/app-test-import');

      let packageJsonPath = path.join(appRoot, 'package.json');
      let packageJson = fs.readJsonSync(packageJsonPath);
      packageJson.devDependencies['ember-test-addon'] = 'latest';
      fs.writeJsonSync(packageJsonPath, packageJson);

      // we need to copy broccoli-plugin into the addon's node_modules to make up for the fact
      // that the mock 'ember-test-addon' does not have a dependency install step
      fs.mkdirSync(path.join(appRoot, 'node_modules', 'ember-test-addon', 'node_modules'));
      await fs.copy(
        path.join('..', '..', 'node_modules', 'broccoli-plugin'),
        path.join(appRoot, 'node_modules', 'ember-test-addon', 'node_modules', 'broccoli-plugin')
      );

      await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

      let checker = new DistChecker(path.join(appRoot, 'dist'));
      expect(checker.contains('js', '// File for test tree imported and added via postprocessTree()')).to.be;
    });
  }

  it('app.import works properly with non-js/css files', async function () {
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

  it('addons can have a public tree that is merged and returned namespaced by default', async function () {
    await copyFixtureFiles('brocfile-tests/public-tree');

    let packageJsonPath = path.join(appRoot, 'package.json');
    let packageJson = fs.readJsonSync(packageJsonPath);
    packageJson.devDependencies['ember-random-addon'] = 'latest';
    fs.writeJsonSync(packageJsonPath, packageJson);

    await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

    let subjectFileContents = fs.readFileSync(path.join(appRoot, 'dist', 'ember-random-addon', 'some-root-file.txt'), {
      encoding: 'utf8',
    });

    expect(subjectFileContents).to.equal('ROOT FILE\n');
  });

  it('using pods based templates', async function () {
    await copyFixtureFiles('brocfile-tests/pods-templates');
    await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
  });

  it('using pods based templates with a podModulePrefix', async function () {
    await copyFixtureFiles('brocfile-tests/pods-with-prefix-templates');
    await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'test');
  });

  it('addon trees are not jshinted', async function () {
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

  it('multiple css files in styles/ are output when a preprocessor is not used', async function () {
    await copyFixtureFiles('brocfile-tests/multiple-css-files');

    await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

    let files = ['/assets/some-cool-app.css', '/assets/other.css'];

    let basePath = path.join(appRoot, 'dist');
    files.forEach(function (f) {
      expect(file(path.join(basePath, f))).to.exist;
    });
  });

  // skipping this as it seems this functionality doesn't work with ember-auto-import@2.2.3
  it.skip('specifying outputFile results in an explicitly generated assets', async function () {
    await copyFixtureFiles('brocfile-tests/app-import-output-file');
    await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

    let files = ['/assets/output-file.js', '/assets/output-file.css', '/assets/vendor.css', '/assets/vendor.js'];

    let basePath = path.join(appRoot, 'dist');
    files.forEach(function (f) {
      expect(file(path.join(basePath, f))).to.exist;
    });
  });

  it('can use transformation to turn anonymous AMD into named AMD', async function () {
    await copyFixtureFiles('brocfile-tests/app-import-anonymous-amd');
    await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

    let outputJS = fs.readFileSync(path.join(appRoot, 'dist', 'assets', 'output.js'), {
      encoding: 'utf8',
    });

    (function () {
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

  it('can use transformation to turn named UMD into named AMD', async function () {
    await copyFixtureFiles('brocfile-tests/app-import-named-umd');
    await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

    let outputJS = fs.readFileSync(path.join(appRoot, 'dist', 'assets', 'output.js'), {
      encoding: 'utf8',
    });

    (function () {
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

  it('can do amd transform from addon', async function () {
    await copyFixtureFiles('brocfile-tests/app-import-custom-transform');

    let packageJsonPath = path.join(appRoot, 'package.json');
    let packageJson = fs.readJsonSync(packageJsonPath);
    packageJson.devDependencies['ember-transform-addon'] = 'latest';
    fs.writeJsonSync(packageJsonPath, packageJson);

    await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

    let addonOutputJs = fs.readFileSync(path.join(appRoot, 'dist', 'assets', 'addon-output.js'), {
      encoding: 'utf8',
    });

    (function () {
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

  it('can use transformation to turn library into custom transformation', async function () {
    await copyFixtureFiles('brocfile-tests/app-import-custom-transform');

    let packageJsonPath = path.join(appRoot, 'package.json');
    let packageJson = fs.readJsonSync(packageJsonPath);
    packageJson.devDependencies['ember-transform-addon'] = 'latest';
    fs.writeJsonSync(packageJsonPath, packageJson);

    await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

    let checker = new DistChecker(path.join(appRoot, 'dist'));

    expect(
      checker.contains(
        'js',
        'if (typeof FastBoot === \'undefined\') { window.hello = "hello world"; }//# sourceMappingURL=output.map\n'
      )
    ).to.be;
  });

  it('app.css is output to <app name>.css by default', async function () {
    await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');
    expect(file(`dist/assets/${appName}.css`)).to.exist;
  });

  // for backwards compat.
  it('app.scss is output to <app name>.css by default', async function () {
    await copyFixtureFiles('brocfile-tests/multiple-sass-files');

    let brocfilePath = path.join(appRoot, 'ember-cli-build.js');
    let brocfile = fs.readFileSync(brocfilePath, 'utf8');

    fs.writeFileSync(brocfilePath, brocfile, 'utf8');

    let packageJsonPath = path.join(appRoot, 'package.json');
    let packageJson = fs.readJsonSync(packageJsonPath);
    packageJson.devDependencies['ember-cli-sass'] = 'latest';
    fs.writeJsonSync(packageJsonPath, packageJson);

    await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

    expect(file(`dist/assets/${appName}.css`)).to.equal('body { background: green; }\n');
  });

  // skipping this as it seems this functionality doesn't work with ember-auto-import@2.2.3
  it.skip('additional trees can be passed to the app', async function () {
    await copyFixtureFiles('brocfile-tests/additional-trees');
    await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build', { verbose: true });

    let files = [
      '/assets/custom-output-file.js',
      '/assets/custom-output-file.css',
      '/assets/vendor.css',
      '/assets/vendor.js',
    ];

    let basePath = path.join(appRoot, 'dist');
    files.forEach(function (f) {
      expect(file(path.join(basePath, f))).to.exist;
    });
  });
});
