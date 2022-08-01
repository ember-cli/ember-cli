'use strict';

const execa = require('execa');
const semver = require('semver');
const fs = require('fs-extra');
const ember = require('../helpers/ember');
const walkSync = require('walk-sync');
const Blueprint = require('../../lib/models/blueprint');
const path = require('path');
const tmp = require('ember-cli-internal-test-helpers/lib/helpers/tmp');
let root = process.cwd();
const util = require('util');
const EOL = require('os').EOL;
const chalk = require('chalk');
const hasGlobalYarn = require('../helpers/has-global-yarn');
const { isExperimentEnabled } = require('../../lib/experiments');

const chai = require('../chai');
let expect = chai.expect;
let file = chai.file;
let dir = chai.dir;
const { forEach } = require('ember-cli-lodash-subset');
const assertVersionLock = require('../helpers/assert-version-lock');

let tmpDir = './tmp/new-test';

describe('Acceptance: ember new', function () {
  this.timeout(30000);
  let ORIGINAL_PROCESS_ENV_CI;

  beforeEach(async function () {
    await tmp.setup(tmpDir);
    process.chdir(tmpDir);
    ORIGINAL_PROCESS_ENV_CI = process.env.CI;
  });

  afterEach(function () {
    if (ORIGINAL_PROCESS_ENV_CI === undefined) {
      delete process.env.CI;
    } else {
      process.env.CI = ORIGINAL_PROCESS_ENV_CI;
    }
    return tmp.teardown(tmpDir);
  });

  function confirmBlueprintedForDir(blueprintDir, expectedAppDir = 'foo') {
    let blueprintPath = path.join(root, blueprintDir, 'files');
    // ignore .travis.yml
    let expected = walkSync(blueprintPath, { ignore: ['.travis.yml', '.vscode'] });
    let actual = walkSync('.').sort();
    let directory = path.basename(process.cwd());

    forEach(Blueprint.renamedFiles, function (destFile, srcFile) {
      expected[expected.indexOf(srcFile)] = destFile;
    });

    expected.sort();

    expect(directory).to.equal(expectedAppDir);
    expect(expected).to.deep.equal(
      actual,
      `${EOL} expected: ${util.inspect(expected)}${EOL} but got: ${util.inspect(actual)}`
    );
  }

  it('ember new adds ember-welcome-page by default', async function () {
    await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git']);

    expect(file('package.json')).to.match(/"ember-welcome-page"/);

    expect(file('app/templates/application.hbs')).to.contain('<WelcomePage />');
  });

  it('ember new @foo/bar, when parent directory does not contain `foo`', async function () {
    await ember(['new', '@foo/bar', '--skip-npm', '--skip-bower']);

    confirmBlueprintedForDir('blueprints/app', 'foo-bar');
  });

  it('ember new @foo/bar, when direct parent directory contains `foo`', async function () {
    let scopedDirectoryPath = path.join(process.cwd(), 'foo');
    fs.mkdirsSync(scopedDirectoryPath);
    process.chdir(scopedDirectoryPath);

    await ember(['new', '@foo/bar', '--skip-npm', '--skip-bower']);

    confirmBlueprintedForDir('blueprints/app', 'bar');
  });

  it('ember new @foo/bar, when parent directory heirarchy contains `foo`', async function () {
    let scopedDirectoryPath = path.join(process.cwd(), 'foo', 'packages');
    fs.mkdirsSync(scopedDirectoryPath);
    process.chdir(scopedDirectoryPath);

    await ember(['new', '@foo/bar', '--skip-npm', '--skip-bower']);

    confirmBlueprintedForDir('blueprints/app', 'bar');
  });

  it('ember new --no-welcome skips installation of ember-welcome-page', async function () {
    await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--no-welcome']);

    expect(file('package.json')).not.to.match(/"ember-welcome-page"/);

    expect(file('app/templates/application.hbs')).to.contain('Welcome to Ember');
  });

  it('ember new generates the correct directory name in `README.md` for scoped package names', async function () {
    await ember(['new', '@foo/bar', '--skip-npm', '--skip-bower', '--skip-git']);

    expect(file('README.md')).to.match(/\* `cd foo-bar`/);
  });

  // ember new foo --lang
  // -------------------------------
  // Good: Correct Usage
  it('ember new foo --lang=(valid code): no message + set `lang` in index.html', async function () {
    await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--lang=en-US']);
    expect(file('app/index.html')).to.contain('<html lang="en-US">');
  });

  // Edge Case: both valid code AND programming language abbreviation, possible misuse
  it('ember new foo --lang=(valid code + programming language abbreviation): emit warning + set `lang` in index.html', async function () {
    await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--lang=css']);
    expect(file('app/index.html')).to.contain('<html lang="css">');
  });

  // Misuse: possibly an attempt to set app programming language
  it('ember new foo --lang=(programming language): emit warning + do not set `lang` in index.html', async function () {
    await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--lang=JavaScript']);
    expect(file('app/index.html')).to.contain('<html>');
  });

  // Misuse: possibly an attempt to set app programming language
  it('ember new foo --lang=(programming language abbreviation): emit warning + do not set `lang` in index.html', async function () {
    await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--lang=JS']);
    expect(file('app/index.html')).to.contain('<html>');
  });

  // Misuse: possibly an attempt to set app programming language
  it('ember new foo --lang=(programming language file extension): emit warning + do not set `lang` in index.html', async function () {
    await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--lang=.js']);
    expect(file('app/index.html')).to.contain('<html>');
  });

  // Misuse: Invalid Country Code
  it('ember new foo --lang=(invalid code): emit warning + do not set `lang` in index.html', async function () {
    await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--lang=en-UK']);
    expect(file('app/index.html')).to.contain('<html>');
  });

  it('ember new npm blueprint with old version', async function () {
    await ember(['new', 'foo', '--blueprint', '@glimmer/blueprint@0.6.4', '--skip-npm', '--skip-bower']);

    expect(dir('src')).to.exist;
  });

  it('ember new foo, where foo does not yet exist, works', async function () {
    await ember(['new', 'foo', '--skip-npm', '--skip-bower']);

    confirmBlueprintedForDir('blueprints/app');
  });

  it('ember new foo, blueprint targets match the default ember-cli targets', async function () {
    await ember(['new', 'foo', '--skip-npm', '--skip-bower']);

    process.env.CI = true;
    const defaultTargets = ['last 1 Chrome versions', 'last 1 Firefox versions', 'last 1 Safari versions'];
    const blueprintTargets = require(path.resolve('config/targets.js')).browsers;
    expect(blueprintTargets).to.have.same.deep.members(defaultTargets);
  });

  it('ember new with empty app name fails with a warning', async function () {
    let err = await expect(ember(['new', ''])).to.be.rejected;

    expect(err.name).to.equal('SilentError');
    expect(err.message).to.contain('The `ember new` command requires a name to be specified.');
  });

  it('ember new without app name fails with a warning', async function () {
    let err = await expect(ember(['new'])).to.be.rejected;

    expect(err.name).to.equal('SilentError');
    expect(err.message).to.contain('The `ember new` command requires a name to be specified.');
  });

  it('ember new with app name creates new directory and has a dasherized package name', async function () {
    await ember(['new', 'FooApp', '--skip-npm', '--skip-bower', '--skip-git']);

    expect(dir('FooApp')).to.not.exist;
    expect(file('package.json')).to.exist;

    let pkgJson = fs.readJsonSync('package.json');
    expect(pkgJson.name).to.equal('foo-app');
  });

  it('Can create new ember project in an existing empty directory', async function () {
    fs.mkdirsSync('bar');

    await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--directory=bar']);
  });

  it('Cannot create new ember project in a populated directory', async function () {
    fs.mkdirsSync('bar');
    fs.writeFileSync(path.join('bar', 'package.json'), '{}');

    let error = await expect(ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--directory=bar'])).to.be
      .rejected;

    expect(error.name).to.equal('SilentError');
    expect(error.message).to.equal("Directory 'bar' already exists.");
  });

  it('Cannot run ember new, inside of ember-cli project', async function () {
    await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git']);

    let error = await expect(ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git'])).to.be.rejected;

    expect(dir('foo')).to.not.exist;
    expect(error.name).to.equal('SilentError');
    expect(error.message).to.equal(`You cannot use the ${chalk.green('new')} command inside an ember-cli project.`);

    confirmBlueprintedForDir('blueprints/app');
  });

  it('ember new with blueprint uses the specified blueprint directory with a relative path', async function () {
    fs.mkdirsSync('my_blueprint/files');
    fs.writeFileSync('my_blueprint/files/gitignore', '');

    await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--blueprint=./my_blueprint']);

    confirmBlueprintedForDir(path.join(tmpDir, 'my_blueprint'));
  });

  it('ember new with blueprint uses the specified blueprint directory with an absolute path', async function () {
    fs.mkdirsSync('my_blueprint/files');
    fs.writeFileSync('my_blueprint/files/gitignore', '');

    await ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      `--blueprint=${path.resolve(process.cwd(), 'my_blueprint')}`,
    ]);

    confirmBlueprintedForDir(path.join(tmpDir, 'my_blueprint'));
  });

  it('ember new with git blueprint checks out the blueprint and uses it', async function () {
    this.timeout(20000); // relies on GH network stuff

    await ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      '--blueprint=https://github.com/ember-cli/app-blueprint-test.git',
    ]);

    expect(file('.ember-cli')).to.exist;
  });

  it('ember new with git blueprint and ref checks out the blueprint with the correct ref and uses it', async function () {
    this.timeout(20000); // relies on GH network stuff

    await ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      '--blueprint=https://github.com/ember-cli/app-blueprint-test.git#named-ref',
    ]);

    expect(file('.named-ref')).to.exist;
  });

  it('ember new with shorthand git blueprint and ref checks out the blueprint with the correct ref and uses it', async function () {
    // Temporarily skipped for npm versions <= v6.0.0.
    // See https://github.com/npm/cli/issues/4896 for more info.
    let { stdout: npmVersion } = await execa('npm', ['-v']);
    if (semver.major(npmVersion) <= 6) {
      this.skip();
    }

    this.timeout(20000); // relies on GH network stuff

    await ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      '--blueprint=ember-cli/app-blueprint-test#named-ref',
    ]);

    expect(file('.named-ref')).to.exist;
  });

  it('ember new passes blueprint options through to blueprint', async function () {
    fs.mkdirsSync('my_blueprint/files');
    fs.writeFileSync(
      'my_blueprint/index.js',
      [
        'module.exports = {',
        "  availableOptions: [ { name: 'custom-option' } ],",
        '  locals(options) {',
        '    return {',
        '      customOption: options.customOption',
        '    };',
        '  }',
        '};',
      ].join('\n')
    );
    fs.writeFileSync('my_blueprint/files/gitignore', '<%= customOption %>');

    await ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      '--blueprint=./my_blueprint',
      '--custom-option=customValue',
    ]);

    expect(file('.gitignore')).to.contain('customValue');
  });

  it('ember new uses yarn when blueprint has yarn.lock', async function () {
    if (!hasGlobalYarn) {
      this.skip();
    }

    fs.mkdirsSync('my_blueprint/files');
    fs.writeFileSync('my_blueprint/index.js', 'module.exports = {};');
    fs.writeFileSync(
      'my_blueprint/files/package.json',
      '{ "name": "foo", "dependencies": { "ember-try-test-suite-helper": "*" }}'
    );
    fs.writeFileSync('my_blueprint/files/yarn.lock', '');

    await ember(['new', 'foo', '--skip-git', '--blueprint=./my_blueprint']);

    expect(file('yarn.lock')).to.not.be.empty;
    expect(dir('node_modules/ember-try-test-suite-helper')).to.not.be.empty;
  });

  it('ember new without skip-git flag creates .git dir', async function () {
    await ember(['new', 'foo', '--skip-npm', '--skip-bower'], {
      skipGit: false,
    });

    expect(dir('.git')).to.exist;
  });

  it('ember new cleans up after itself on error', async function () {
    fs.mkdirsSync('my_blueprint');
    fs.writeFileSync('my_blueprint/index.js', 'throw("this will break");');

    await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--blueprint=./my_blueprint']);

    expect(dir('foo')).to.not.exist;
  });

  it('ember new with --dry-run does not create new directory', async function () {
    await ember(['new', 'foo', '--dry-run']);

    expect(process.cwd()).to.not.match(/foo/, 'does not change cwd to foo in a dry run');
    expect(dir('foo')).to.not.exist;
    expect(dir('.git')).to.not.exist;
  });

  it('ember new with --directory uses given directory name and has correct package name', async function () {
    let workdir = process.cwd();

    await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--directory=bar']);

    expect(dir(path.join(workdir, 'foo'))).to.not.exist;
    expect(dir(path.join(workdir, 'bar'))).to.exist;

    let cwd = process.cwd();
    expect(cwd).to.not.match(/foo/, 'does not use app name for directory name');
    expect(cwd).to.match(/bar/, 'uses given directory name');

    let pkgJson = fs.readJsonSync('package.json');
    expect(pkgJson.name).to.equal('foo', 'uses app name for package name');
  });

  it('ember addon with --directory uses given directory name and has correct package name', async function () {
    let workdir = process.cwd();

    await ember(['addon', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--directory=bar']);

    expect(dir(path.join(workdir, 'foo'))).to.not.exist;
    expect(dir(path.join(workdir, 'bar'))).to.exist;

    let cwd = process.cwd();
    expect(cwd).to.not.match(/foo/, 'does not use addon name for directory name');
    expect(cwd).to.match(/bar/, 'uses given directory name');

    let pkgJson = fs.readJsonSync('package.json');
    expect(pkgJson.name).to.equal('foo', 'uses addon name for package name');
  });

  it('ember addon @foo/bar when parent directory does not contain `foo`', async function () {
    await ember(['addon', '@foo/bar', '--skip-npm', '--skip-bower', '--skip-git']);

    let directoryName = path.basename(process.cwd());

    expect(directoryName).to.equal('foo-bar');

    let pkgJson = fs.readJsonSync('package.json');
    expect(pkgJson.name).to.equal('@foo/bar', 'uses addon name for package name');
  });

  it('ember addon @foo/bar when parent directory contains `foo`', async function () {
    let scopedDirectoryPath = path.join(process.cwd(), 'foo');
    fs.mkdirsSync(scopedDirectoryPath);
    process.chdir(scopedDirectoryPath);

    await ember(['addon', '@foo/bar', '--skip-npm', '--skip-bower', '--skip-git']);

    let directoryName = path.basename(process.cwd());

    expect(directoryName).to.equal('bar');

    let pkgJson = fs.readJsonSync('package.json');
    expect(pkgJson.name).to.equal('@foo/bar', 'uses addon name for package name');
  });

  it('ember addon generates the correct directory name in `CONTRIBUTING.md` for scoped package names', async function () {
    await ember(['addon', '@foo/bar', '--skip-npm', '--skip-bower', '--skip-git']);

    expect(file('CONTRIBUTING.md')).to.match(/\* `cd foo-bar`/);
  });

  if (!isExperimentEnabled('CLASSIC')) {
    it('embroider experiment creates the correct files', async function () {
      let ORIGINAL_PROCESS_ENV = process.env.EMBER_CLI_EMBROIDER;
      process.env['EMBER_CLI_EMBROIDER'] = 'true';
      await ember(['new', 'foo', '--skip-npm', '--skip-git', '--skip-bower']);

      if (ORIGINAL_PROCESS_ENV === undefined) {
        delete process.env['EMBER_CLI_EMBROIDER'];
      } else {
        process.env['EMBER_CLI_EMBROIDER'] = ORIGINAL_PROCESS_ENV;
      }

      let pkgJson = fs.readJsonSync('package.json');
      expect(pkgJson.devDependencies['@embroider/compat']).to.exist;
      expect(pkgJson.devDependencies['@embroider/core']).to.exist;
      expect(pkgJson.devDependencies['@embroider/webpack']).to.exist;
    });
  }

  it('embroider enabled with --embroider', async function () {
    await ember(['new', 'foo', '--skip-npm', '--skip-git', '--skip-bower', '--embroider']);

    let pkgJson = fs.readJsonSync('package.json');
    expect(pkgJson.devDependencies['@embroider/compat']).to.exist;
    expect(pkgJson.devDependencies['@embroider/core']).to.exist;
    expect(pkgJson.devDependencies['@embroider/webpack']).to.exist;
  });

  describe('verify fixtures', function () {
    function checkEslintConfig(fixturePath) {
      expect(file('.eslintrc.js')).to.equal(file(path.join(__dirname, '../fixtures', fixturePath, '.eslintrc.js')));
    }

    function checkFileWithEmberCLIVersionReplacement(fixtureName, fileName) {
      let currentVersion = require('../../package').version;
      let fixturePath = path.join(__dirname, '../fixtures', fixtureName, fileName);
      let fixtureContents = fs
        .readFileSync(fixturePath, { encoding: 'utf-8' })
        .replace('<%= emberCLIVersion %>', currentVersion);

      expect(file(fileName)).to.equal(fixtureContents);
    }

    function checkEmberCLIBuild(fixtureName, fileName) {
      let fixturePath = path.join(__dirname, '../fixtures', fixtureName, fileName);
      let fixtureContents = fs.readFileSync(fixturePath, { encoding: 'utf-8' });
      expect(file(fileName)).to.equal(fixtureContents);
    }

    it('app defaults', async function () {
      await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git']);

      let namespace = 'app';
      let fixturePath = `${namespace}/defaults`;

      ['app/templates/application.hbs', '.github/workflows/ci.yml', 'README.md'].forEach((filePath) => {
        checkFile(filePath, path.join(__dirname, '../fixtures', fixturePath, filePath));
      });

      expect(file('.travis.yml')).to.not.exist;

      if (isExperimentEnabled('EMBROIDER')) {
        fixturePath = `${namespace}/embroider`;
      }

      checkFileWithEmberCLIVersionReplacement(fixturePath, 'config/ember-cli-update.json');
      checkFileWithEmberCLIVersionReplacement(fixturePath, 'package.json');
      checkEmberCLIBuild(fixturePath, 'ember-cli-build.js');

      // option independent, but piggy-backing on an existing generate for speed
      checkEslintConfig(namespace);

      // ember new without --lang flag (default) has no lang attribute in index.html
      expect(file('app/index.html')).to.contain('<html>');
    });

    it('addon defaults', async function () {
      await ember(['addon', 'foo', '--skip-npm', '--skip-bower', '--skip-git']);

      let namespace = 'addon';
      let fixturePath = `${namespace}/defaults`;

      [
        'config/ember-try.js',
        'tests/dummy/app/templates/application.hbs',
        '.github/workflows/ci.yml',
        'README.md',
        'CONTRIBUTING.md',
      ].forEach((filePath) => {
        checkFile(filePath, path.join(__dirname, '../fixtures', fixturePath, filePath));
      });

      expect(file('.travis.yml')).to.not.exist;

      checkFileWithEmberCLIVersionReplacement(fixturePath, 'package.json');
      checkFileWithEmberCLIVersionReplacement(fixturePath, 'tests/dummy/config/ember-cli-update.json');

      // option independent, but piggy-backing on an existing generate for speed
      checkEslintConfig(namespace);

      // ember addon without --lang flag (default) has no lang attribute in dummy index.html
      expect(file('tests/dummy/app/index.html')).to.contain('<html>');
    });

    it('app + npm + !welcome', async function () {
      await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--no-welcome']);

      let namespace = 'app';
      let fixturePath = `${namespace}/npm`;

      ['app/templates/application.hbs', '.github/workflows/ci.yml', 'README.md'].forEach((filePath) => {
        checkFile(filePath, path.join(__dirname, '../fixtures', fixturePath, filePath));
      });

      expect(file('.travis.yml')).to.not.exist;

      if (isExperimentEnabled('EMBROIDER')) {
        fixturePath = 'app/embroider-no-welcome';
      }

      checkFileWithEmberCLIVersionReplacement(fixturePath, 'config/ember-cli-update.json');
      checkFileWithEmberCLIVersionReplacement(fixturePath, 'package.json');
      // option independent, but piggy-backing on an existing generate for speed
      checkEslintConfig(namespace);
    });

    it('app + yarn + welcome', async function () {
      await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--yarn']);

      let fixturePath = 'app/yarn';

      ['app/templates/application.hbs', '.github/workflows/ci.yml', 'README.md'].forEach((filePath) => {
        checkFile(filePath, path.join(__dirname, '../fixtures', fixturePath, filePath));
      });

      expect(file('.travis.yml')).to.not.exist;

      if (isExperimentEnabled('EMBROIDER')) {
        fixturePath = 'app/embroider-yarn';
      }

      checkFileWithEmberCLIVersionReplacement(fixturePath, 'config/ember-cli-update.json');
      checkFileWithEmberCLIVersionReplacement(fixturePath, 'package.json');
    });

    it('addon + yarn + welcome', async function () {
      await ember(['addon', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--yarn', '--welcome']);

      let fixturePath = 'addon/yarn';

      [
        'config/ember-try.js',
        'tests/dummy/app/templates/application.hbs',
        '.github/workflows/ci.yml',
        'README.md',
        'CONTRIBUTING.md',
      ].forEach((filePath) => {
        checkFile(filePath, path.join(__dirname, '../fixtures', fixturePath, filePath));
      });

      expect(file('.travis.yml')).to.not.exist;

      checkFileWithEmberCLIVersionReplacement(fixturePath, 'package.json');
      checkFileWithEmberCLIVersionReplacement(fixturePath, 'tests/dummy/config/ember-cli-update.json');
    });

    it('configurable CI option', async function () {
      await ember(['new', 'foo', '--ci-provider=travis', '--skip-npm', '--skip-bower', '--skip-git']);

      let fixturePath = 'app/npm-travis';

      expect(file('.travis.yml')).to.equal(file(path.join(__dirname, '../fixtures', fixturePath, '.travis.yml')));

      expect(file('.github/workflows/ci.yml')).to.not.exist;

      if (isExperimentEnabled('EMBROIDER')) {
        fixturePath = 'app/npm-travis-embroider';
      }

      checkFileWithEmberCLIVersionReplacement(fixturePath, 'config/ember-cli-update.json');
    });

    it('configurable CI option with yarn', async function () {
      await ember(['new', 'foo', '--ci-provider=travis', '--skip-npm', '--skip-bower', '--skip-git', '--yarn']);

      let fixturePath = 'app/yarn-travis';

      expect(file('.travis.yml')).to.equal(file(path.join(__dirname, '../fixtures', fixturePath, '.travis.yml')));
      expect(file('.github/workflows/ci.yml')).to.not.exist;

      if (isExperimentEnabled('EMBROIDER')) {
        fixturePath = 'app/yarn-travis-embroider';
      }

      checkFileWithEmberCLIVersionReplacement(fixturePath, 'config/ember-cli-update.json');
    });

    it('addon configurable CI option', async function () {
      await ember(['addon', 'foo', '--ci-provider=travis', '--skip-npm', '--skip-bower', '--skip-git']);

      let namespace = 'addon';
      let fixturePath = `${namespace}/defaults-travis`;

      expect(file('.travis.yml')).to.equal(file(path.join(__dirname, '../fixtures', fixturePath, '.travis.yml')));
      expect(file('.github/workflows/ci.yml')).to.not.exist;

      checkFileWithEmberCLIVersionReplacement(fixturePath, 'tests/dummy/config/ember-cli-update.json');
    });

    it('should not create .vscode folder', async function () {
      await ember(['init', '--skip-npm', '--skip-bower']);

      expect(dir('.vscode')).to.not.exist;
    });

    it('should create .vscode folder', async function () {
      await ember(['init', '--code-editor=vscode', '--skip-npm', '--skip-bower']);

      expect(dir('.vscode')).to.exist;
    });
  });

  describe('verify dependencies', function () {
    it('are locked down for pre-1.0 versions', async function () {
      await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--yarn', '--welcome']);

      let pkg = fs.readJsonSync('package.json');

      assertVersionLock(pkg.dependencies);
      assertVersionLock(pkg.devDependencies);
    });
  });
});

function checkFile(inputPath, outputPath) {
  if (process.env.WRITE_FIXTURES) {
    let content = fs.readFileSync(inputPath, { encoding: 'utf-8' });
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, content, { encoding: 'utf-8' });
  }

  expect(file(inputPath)).to.equal(file(outputPath));
}
