'use strict';

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

const chai = require('../chai');
let expect = chai.expect;
let file = chai.file;
let dir = chai.dir;
const forEach = require('ember-cli-lodash-subset').forEach;
const assertVersionLock = require('../helpers/assert-version-lock');

let tmpDir = './tmp/new-test';

describe('Acceptance: ember new', function() {
  this.timeout(10000);
  let ORIGINAL_PROCESS_ENV_CI;

  beforeEach(async function() {
    await tmp.setup(tmpDir);
    process.chdir(tmpDir);
    ORIGINAL_PROCESS_ENV_CI = process.env.CI;
  });

  afterEach(function() {
    if (ORIGINAL_PROCESS_ENV_CI === undefined) {
      delete process.env.CI;
    } else {
      process.env.CI = ORIGINAL_PROCESS_ENV_CI;
    }
    return tmp.teardown(tmpDir);
  });

  function confirmBlueprintedForDir(blueprintDir, expectedAppDir = 'foo') {
    let blueprintPath = path.join(root, blueprintDir, 'files');
    let expected = walkSync(blueprintPath);
    let actual = walkSync('.').sort();
    let directory = path.basename(process.cwd());

    forEach(Blueprint.renamedFiles, function(destFile, srcFile) {
      expected[expected.indexOf(srcFile)] = destFile;
    });

    expected.sort();

    expect(directory).to.equal(expectedAppDir);
    expect(expected).to.deep.equal(
      actual,
      `${EOL} expected: ${util.inspect(expected)}${EOL} but got: ${util.inspect(actual)}`
    );
  }

  it('ember new adds ember-welcome-page by default', async function() {
    await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git']);

    expect(file('package.json')).to.match(/"ember-welcome-page"/);

    expect(file('app/templates/application.hbs')).to.contain('<WelcomePage />');
  });

  it('ember new @foo/bar, when parent directory does not contain `foo`', async function() {
    await ember(['new', '@foo/bar', '--skip-npm', '--skip-bower']);

    confirmBlueprintedForDir('blueprints/app', 'foo-bar');
  });

  it('ember new @foo/bar, when direct parent directory contains `foo`', async function() {
    let scopedDirectoryPath = path.join(process.cwd(), 'foo');
    fs.mkdirsSync(scopedDirectoryPath);
    process.chdir(scopedDirectoryPath);

    await ember(['new', '@foo/bar', '--skip-npm', '--skip-bower']);

    confirmBlueprintedForDir('blueprints/app', 'bar');
  });

  it('ember new @foo/bar, when parent directory heirarchy contains `foo`', async function() {
    let scopedDirectoryPath = path.join(process.cwd(), 'foo', 'packages');
    fs.mkdirsSync(scopedDirectoryPath);
    process.chdir(scopedDirectoryPath);

    await ember(['new', '@foo/bar', '--skip-npm', '--skip-bower']);

    confirmBlueprintedForDir('blueprints/app', 'bar');
  });

  it('ember new --no-welcome skips installation of ember-welcome-page', async function() {
    await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--no-welcome']);

    expect(file('package.json')).not.to.match(/"ember-welcome-page"/);

    expect(file('app/templates/application.hbs')).to.contain('Welcome to Ember');
  });

  it('ember new npm blueprint with old version', async function() {
    await ember(['new', 'foo', '--blueprint', '@glimmer/blueprint@0.6.4', '--skip-npm', '--skip-bower']);

    expect(dir('src')).to.exist;
  });

  it('ember new foo, where foo does not yet exist, works', async function() {
    await ember(['new', 'foo', '--skip-npm', '--skip-bower']);

    confirmBlueprintedForDir('blueprints/app');
  });

  it('ember new foo, blueprint targets match the default ember-cli targets', async function() {
    await ember(['new', 'foo', '--skip-npm', '--skip-bower']);

    process.env.CI = true;
    const defaultTargets = require('../../lib/utilities/default-targets').browsers;
    const blueprintTargets = require(path.resolve('config/targets.js')).browsers;
    expect(blueprintTargets).to.have.same.deep.members(defaultTargets);
  });

  it('ember new with empty app name fails with a warning', async function() {
    let err = await expect(ember(['new', ''])).to.be.rejected;

    expect(err.name).to.equal('SilentError');
    expect(err.message).to.contain('The `ember new` command requires a name to be specified.');
  });

  it('ember new without app name fails with a warning', async function() {
    let err = await expect(ember(['new'])).to.be.rejected;

    expect(err.name).to.equal('SilentError');
    expect(err.message).to.contain('The `ember new` command requires a name to be specified.');
  });

  it('ember new with app name creates new directory and has a dasherized package name', async function() {
    await ember(['new', 'FooApp', '--skip-npm', '--skip-bower', '--skip-git']);

    expect(dir('FooApp')).to.not.exist;
    expect(file('package.json')).to.exist;

    let pkgJson = fs.readJsonSync('package.json');
    expect(pkgJson.name).to.equal('foo-app');
  });

  it('Can create new ember project in an existing empty directory', async function() {
    fs.mkdirsSync('bar');

    await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--directory=bar']);
  });

  it('Cannot create new ember project in a populated directory', async function() {
    fs.mkdirsSync('bar');
    fs.writeFileSync(path.join('bar', 'package.json'), '{}');

    let error = await expect(ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--directory=bar'])).to.be
      .rejected;

    expect(error.name).to.equal('SilentError');
    expect(error.message).to.equal("Directory 'bar' already exists.");
  });

  it('Cannot run ember new, inside of ember-cli project', async function() {
    await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git']);

    let error = await expect(ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git'])).to.be.rejected;

    expect(dir('foo')).to.not.exist;
    expect(error.name).to.equal('SilentError');
    expect(error.message).to.equal(`You cannot use the ${chalk.green('new')} command inside an ember-cli project.`);

    confirmBlueprintedForDir('blueprints/app');
  });

  it('ember new with blueprint uses the specified blueprint directory with a relative path', async function() {
    fs.mkdirsSync('my_blueprint/files');
    fs.writeFileSync('my_blueprint/files/gitignore', '');

    await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--blueprint=./my_blueprint']);

    confirmBlueprintedForDir(path.join(tmpDir, 'my_blueprint'));
  });

  it('ember new with blueprint uses the specified blueprint directory with an absolute path', async function() {
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

  it('ember new with git blueprint checks out the blueprint and uses it', async function() {
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

  it('ember new with git blueprint and ref checks out the blueprint with the correct ref and uses it', async function() {
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

  it('ember new with shorthand git blueprint and ref checks out the blueprint with the correct ref and uses it', async function() {
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

  it('ember new passes blueprint options through to blueprint', async function() {
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

  it('ember new uses yarn when blueprint has yarn.lock', async function() {
    if (!hasGlobalYarn) {
      this.skip();
    }

    fs.mkdirsSync('my_blueprint/files');
    fs.writeFileSync('my_blueprint/index.js', 'module.exports = {};');
    fs.writeFileSync('my_blueprint/files/package.json', '{ "name": "foo", "dependencies": { "fs-extra": "*" }}');
    fs.writeFileSync('my_blueprint/files/yarn.lock', '');

    await ember(['new', 'foo', '--skip-git', '--blueprint=./my_blueprint']);

    expect(file('yarn.lock')).to.not.be.empty;
    expect(dir('node_modules/fs-extra')).to.not.be.empty;
  });

  it('ember new without skip-git flag creates .git dir', async function() {
    await ember(['new', 'foo', '--skip-npm', '--skip-bower'], {
      skipGit: false,
    });

    expect(dir('.git')).to.exist;
  });

  it('ember new cleans up after itself on error', async function() {
    fs.mkdirsSync('my_blueprint');
    fs.writeFileSync('my_blueprint/index.js', 'throw("this will break");');

    await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--blueprint=./my_blueprint']);

    expect(dir('foo')).to.not.exist;
  });

  it('ember new with --dry-run does not create new directory', async function() {
    await ember(['new', 'foo', '--dry-run']);

    expect(process.cwd()).to.not.match(/foo/, 'does not change cwd to foo in a dry run');
    expect(dir('foo')).to.not.exist;
    expect(dir('.git')).to.not.exist;
  });

  it('ember new with --directory uses given directory name and has correct package name', async function() {
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

  it('ember addon with --directory uses given directory name and has correct package name', async function() {
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

  it('ember addon @foo/bar when parent directory does not contain `foo`', async function() {
    await ember(['addon', '@foo/bar', '--skip-npm', '--skip-bower', '--skip-git']);

    let directoryName = path.basename(process.cwd());

    expect(directoryName).to.equal('foo-bar');

    let pkgJson = fs.readJsonSync('package.json');
    expect(pkgJson.name).to.equal('@foo/bar', 'uses addon name for package name');
  });

  it('ember addon @foo/bar when parent directory contains `foo`', async function() {
    let scopedDirectoryPath = path.join(process.cwd(), 'foo');
    fs.mkdirsSync(scopedDirectoryPath);
    process.chdir(scopedDirectoryPath);

    await ember(['addon', '@foo/bar', '--skip-npm', '--skip-bower', '--skip-git']);

    let directoryName = path.basename(process.cwd());

    expect(directoryName).to.equal('bar');

    let pkgJson = fs.readJsonSync('package.json');
    expect(pkgJson.name).to.equal('@foo/bar', 'uses addon name for package name');
  });

  describe('verify fixtures', function() {
    function checkEslintConfig(fixturePath) {
      expect(file('.eslintrc.js')).to.equal(file(path.join(__dirname, '../fixtures', fixturePath, '.eslintrc.js')));
    }

    function checkPackageJson(fixtureName) {
      let currentVersion = require('../../package').version;
      let fixturePath = path.join(__dirname, '../fixtures', fixtureName, 'package.json');
      let fixtureContents = fs
        .readFileSync(fixturePath, { encoding: 'utf-8' })
        .replace('<%= emberCLIVersion %>', currentVersion);

      expect(file('package.json')).to.equal(fixtureContents);
    }

    it('app + npm + !welcome', async function() {
      await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--no-welcome']);

      let namespace = 'app';
      let fixturePath = `${namespace}/npm`;

      ['app/templates/application.hbs', '.travis.yml', 'README.md'].forEach(filePath => {
        expect(file(filePath)).to.equal(file(path.join(__dirname, '../fixtures', fixturePath, filePath)));
      });

      checkPackageJson(fixturePath);

      // option independent, but piggy-backing on an existing generate for speed
      checkEslintConfig(namespace);
    });

    it('app + yarn + welcome', async function() {
      await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--yarn']);

      let fixturePath = 'app/yarn';

      ['app/templates/application.hbs', '.travis.yml', 'README.md'].forEach(filePath => {
        expect(file(filePath)).to.equal(file(path.join(__dirname, '../fixtures', fixturePath, filePath)));
      });

      checkPackageJson(fixturePath);
    });

    it('addon + yarn + welcome', async function() {
      await ember(['addon', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--yarn', '--welcome']);

      let fixturePath = 'addon/yarn';

      [
        'config/ember-try.js',
        'tests/dummy/app/templates/application.hbs',
        '.travis.yml',
        'README.md',
        'CONTRIBUTING.md',
      ].forEach(filePath => {
        expect(file(filePath)).to.equal(file(path.join(__dirname, '../fixtures', fixturePath, filePath)));
      });

      checkPackageJson(fixturePath);
    });

    it('addon + npm + !welcome', async function() {
      await ember(['addon', 'foo', '--skip-npm', '--skip-bower', '--skip-git']);

      let namespace = 'addon';
      let fixturePath = `${namespace}/npm`;

      [
        'config/ember-try.js',
        'tests/dummy/app/templates/application.hbs',
        '.travis.yml',
        'README.md',
        'CONTRIBUTING.md',
      ].forEach(filePath => {
        expect(file(filePath)).to.equal(file(path.join(__dirname, '../fixtures', fixturePath, filePath)));
      });

      checkPackageJson(fixturePath);

      // option independent, but piggy-backing on an existing generate for speed
      checkEslintConfig(namespace);
    });
  });

  describe('verify dependencies', function() {
    it('are locked down for pre-1.0 versions', async function() {
      await ember(['new', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--yarn', '--welcome']);

      let pkg = fs.readJsonSync('package.json');

      assertVersionLock(pkg.dependencies);
      assertVersionLock(pkg.devDependencies);
    });
  });
});
