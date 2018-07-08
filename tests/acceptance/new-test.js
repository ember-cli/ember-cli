'use strict';

const co = require('co');
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

const chai = require('../chai');
let expect = chai.expect;
let file = chai.file;
let dir = chai.dir;
const forEach = require('ember-cli-lodash-subset').forEach;
const assertVersionLock = require('../helpers/assert-version-lock');
const experiments = require('../../lib/experiments');

let tmpDir = './tmp/new-test';

describe('Acceptance: ember new', function() {
  this.timeout(10000);

  beforeEach(co.wrap(function *() {
    yield tmp.setup(tmpDir);
    process.chdir(tmpDir);
  }));

  afterEach(function() {
    return tmp.teardown(tmpDir);
  });

  function confirmBlueprintedForDir(dir) {
    let blueprintPath = path.join(root, dir, 'files');
    let expected = walkSync(blueprintPath);
    let actual = walkSync('.').sort();
    let directory = path.basename(process.cwd());

    forEach(Blueprint.renamedFiles, function(destFile, srcFile) {
      expected[expected.indexOf(srcFile)] = destFile;
    });

    expected.sort();

    expect(directory).to.equal('foo');
    expect(expected)
      .to.deep.equal(actual, `${EOL} expected: ${util.inspect(expected)}${EOL} but got: ${util.inspect(actual)}`);
  }

  function confirmBlueprintedApp() {
    if (experiments.MODULE_UNIFICATION) {
      return confirmBlueprintedForDir('blueprints/module-unification-app');
    }
    return confirmBlueprintedForDir('blueprints/app');
  }

  if (experiments.MODULE_UNIFICATION) {
    it('EMBER_CLI_MODULE_UNIFICATION: ember addon foo works', co.wrap(function *() {
      yield ember([
        'addon',
        'foo',
        '--skip-npm',
        '--skip-bower',
      ]);

      // the fixture files are now out of sync because
      // this only tests file count and names, not contents
      let expectedFiles = walkSync(path.join(__dirname, '../fixtures', 'module-unification-addon'))
        .sort()
        .filter(e => e !== '.DS_Store');
      let actualFiles = walkSync('.').sort().filter(e => e !== '.DS_Store');
      expect(actualFiles).to.deep.equal(expectedFiles);
    }));
  } else {
    // TODO: this should pass in both MU and classic
    it('ember new adds ember-welcome-page by default', co.wrap(function *() {
      yield ember([
        'new',
        'foo',
        '--skip-npm',
        '--skip-bower',
        '--skip-git',
      ]);

      expect(file('package.json'))
        .to.match(/"ember-welcome-page"/);

      expect(file('app/templates/application.hbs'))
        .to.contain("{{welcome-page}}");
    }));

    // TODO: this should pass in both MU and classic
    it('ember new --no-welcome skips installation of ember-welcome-page', co.wrap(function *() {
      yield ember([
        'new',
        'foo',
        '--skip-npm',
        '--skip-bower',
        '--skip-git',
        '--no-welcome',
      ]);

      expect(file('package.json'))
        .not.to.match(/"ember-welcome-page"/);

      expect(file('app/templates/application.hbs'))
        .to.contain("Welcome to Ember");
    }));
  }

  it('ember new foo, where foo does not yet exist, works', co.wrap(function *() {
    yield ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
    ]);

    confirmBlueprintedApp();
  }));

  it('ember new with empty app name fails with a warning', co.wrap(function *() {
    let err = yield expect(ember([
      'new',
      '',
    ])).to.be.rejected;

    expect(err.name).to.equal('SilentError');
    expect(err.message).to.contain('The `ember new` command requires a name to be specified.');
  }));

  it('ember new without app name fails with a warning', co.wrap(function *() {
    let err = yield expect(ember([
      'new',
    ])).to.be.rejected;

    expect(err.name).to.equal('SilentError');
    expect(err.message).to.contain('The `ember new` command requires a name to be specified.');
  }));

  it('ember new with app name creates new directory and has a dasherized package name', co.wrap(function *() {
    yield ember([
      'new',
      'FooApp',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
    ]);

    expect(dir('FooApp')).to.not.exist;
    expect(file('package.json')).to.exist;

    let pkgJson = fs.readJsonSync('package.json');
    expect(pkgJson.name).to.equal('foo-app');
  }));

  it('Can create new ember project in an existing empty directory', co.wrap(function *() {
    fs.mkdirsSync('bar');

    yield ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      '--directory=bar',
    ]);
  }));

  it('Cannot create new ember project in a populated directory', co.wrap(function *() {
    fs.mkdirsSync('bar');
    fs.writeFileSync(path.join('bar', 'package.json'), '{}');

    let error = yield expect(ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      '--directory=bar',
    ])).to.be.rejected;

    expect(error.name).to.equal('SilentError');
    expect(error.message).to.equal('Directory \'bar\' already exists.');
  }));

  it('Cannot run ember new, inside of ember-cli project', co.wrap(function *() {
    yield ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
    ]);

    let error = yield expect(ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
    ])).to.be.rejected;

    expect(dir('foo')).to.not.exist;
    expect(error.name).to.equal('SilentError');
    expect(error.message).to.equal(`You cannot use the ${chalk.green('new')} command inside an ember-cli project.`);

    confirmBlueprintedApp();
  }));

  it('ember new with blueprint uses the specified blueprint directory with a relative path', co.wrap(function *() {
    fs.mkdirsSync('my_blueprint/files');
    fs.writeFileSync('my_blueprint/files/gitignore');

    yield ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      '--blueprint=./my_blueprint',
    ]);

    confirmBlueprintedForDir(path.join(tmpDir, 'my_blueprint'));
  }));

  it('ember new with blueprint uses the specified blueprint directory with an absolute path', co.wrap(function *() {
    fs.mkdirsSync('my_blueprint/files');
    fs.writeFileSync('my_blueprint/files/gitignore');

    yield ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      `--blueprint=${path.resolve(process.cwd(), 'my_blueprint')}`,
    ]);

    confirmBlueprintedForDir(path.join(tmpDir, 'my_blueprint'));
  }));

  it('ember new with git blueprint checks out the blueprint and uses it', co.wrap(function *() {
    this.timeout(20000); // relies on GH network stuff

    yield ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      '--blueprint=https://github.com/ember-cli/app-blueprint-test.git',
    ]);

    expect(file('.ember-cli')).to.exist;
  }));

  it('ember new passes blueprint options through to blueprint', co.wrap(function *() {
    fs.mkdirsSync('my_blueprint/files');
    fs.writeFileSync('my_blueprint/index.js', [
      'module.exports = {',
      '  availableOptions: [ { name: \'custom-option\' } ],',
      '  locals(options) {',
      '    return {',
      '      customOption: options.customOption',
      '    };',
      '  }',
      '};',
    ].join('\n'));
    fs.writeFileSync('my_blueprint/files/gitignore', '<%= customOption %>');

    yield ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      '--blueprint=./my_blueprint',
      '--custom-option=customValue',
    ]);

    expect(file('.gitignore')).to.contain('customValue');
  }));

  it('ember new uses yarn when blueprint has yarn.lock', co.wrap(function *() {
    fs.mkdirsSync('my_blueprint/files');
    fs.writeFileSync('my_blueprint/index.js', 'module.exports = {};');
    fs.writeFileSync('my_blueprint/files/package.json', '{ "name": "foo", "dependencies": { "fs-extra": "*" }}');
    fs.writeFileSync('my_blueprint/files/yarn.lock', '');

    yield ember([
      'new',
      'foo',
      '--skip-git',
      '--blueprint=./my_blueprint',
    ]);

    expect(file('yarn.lock')).to.not.be.empty;
    expect(dir('node_modules/fs-extra')).to.not.be.empty;
  }));

  it('ember new without skip-git flag creates .git dir', co.wrap(function *() {
    yield ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
    ], {
      skipGit: false,
    });

    expect(dir('.git')).to.exist;
  }));

  it('ember new cleans up after itself on error', co.wrap(function *() {
    fs.mkdirsSync('my_blueprint');
    fs.writeFileSync('my_blueprint/index.js', 'throw("this will break");');

    yield ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      '--blueprint=./my_blueprint',
    ]);

    expect(dir('foo')).to.not.exist;
  }));

  it('ember new with --dry-run does not create new directory', co.wrap(function *() {
    yield ember([
      'new',
      'foo',
      '--dry-run',
    ]);

    expect(process.cwd()).to.not.match(/foo/, 'does not change cwd to foo in a dry run');
    expect(dir('foo')).to.not.exist;
    expect(dir('.git')).to.not.exist;
  }));

  it('ember new with --directory uses given directory name and has correct package name', co.wrap(function *() {
    let workdir = process.cwd();

    yield ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      '--directory=bar',
    ]);

    expect(dir(path.join(workdir, 'foo'))).to.not.exist;
    expect(dir(path.join(workdir, 'bar'))).to.exist;

    let cwd = process.cwd();
    expect(cwd).to.not.match(/foo/, 'does not use app name for directory name');
    expect(cwd).to.match(/bar/, 'uses given directory name');

    let pkgJson = fs.readJsonSync('package.json');
    expect(pkgJson.name).to.equal('foo', 'uses app name for package name');
  }));

  it('ember addon with --directory uses given directory name and has correct package name', co.wrap(function *() {
    let workdir = process.cwd();

    yield ember([
      'addon',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      '--directory=bar',
    ]);

    expect(dir(path.join(workdir, 'foo'))).to.not.exist;
    expect(dir(path.join(workdir, 'bar'))).to.exist;

    let cwd = process.cwd();
    expect(cwd).to.not.match(/foo/, 'does not use addon name for directory name');
    expect(cwd).to.match(/bar/, 'uses given directory name');

    let pkgJson = fs.readJsonSync('package.json');
    expect(pkgJson.name).to.equal('foo', 'uses addon name for package name');
  }));

  describe('verify fixtures', function() {
    function checkPackageJson(fixtureName) {
      let currentVersion = require('../../package').version;
      let fixturePath = path.join(__dirname, '../fixtures', fixtureName, 'package.json');
      let fixtureContents = fs.readFileSync(fixturePath, { encoding: 'utf-8' })
        .replace("<%= emberCLIVersion %>", currentVersion);

      expect(file('package.json'))
        .to.equal(fixtureContents);
    }

    it('module-unification-app + npm + !welcome', co.wrap(function *() {
      yield ember([
        'new',
        'foo',
        '--blueprint',
        'module-unification-app',
        '--skip-npm',
        '--skip-bower',
        '--skip-git',
        '--no-welcome',
      ]);

      let fixturePath = 'module-unification-app/npm';
      [
        'src/ui/routes/application/template.hbs',
        '.travis.yml',
        'README.md',
        '.eslintrc.js',
      ].forEach(filePath => {
        expect(file(filePath))
          .to.equal(file(path.join(__dirname, '../fixtures', fixturePath, filePath)));
      });

      checkPackageJson(fixturePath);
    }));

    it('module-unification-app + yarn + welcome', co.wrap(function *() {
      yield ember([
        'new',
        'foo',
        '--blueprint',
        'module-unification-app',
        '--skip-npm',
        '--skip-bower',
        '--skip-git',
        '--yarn',
      ]);

      let fixturePath = 'module-unification-app/yarn';
      [
        'src/ui/routes/application/template.hbs',
        '.travis.yml',
        'README.md',
        '.eslintrc.js',
      ].forEach(filePath => {
        expect(file(filePath))
          .to.equal(file(path.join(__dirname, '../fixtures', fixturePath, filePath)));
      });

      checkPackageJson(fixturePath);
    }));

    if (!experiments.MODULE_UNIFICATION) {
      it('app + npm + !welcome', co.wrap(function *() {
        yield ember([
          'new',
          'foo',
          '--skip-npm',
          '--skip-bower',
          '--skip-git',
          '--no-welcome',
        ]);

        let fixturePath = 'app/npm';
        [
          'app/templates/application.hbs',
          '.travis.yml',
          'README.md',
          '.eslintrc.js',
        ].forEach(filePath => {
          expect(file(filePath))
            .to.equal(file(path.join(__dirname, '../fixtures', fixturePath, filePath)));
        });

        checkPackageJson(fixturePath);
      }));

      it('app + yarn + welcome', co.wrap(function *() {
        yield ember([
          'new',
          'foo',
          '--skip-npm',
          '--skip-bower',
          '--skip-git',
          '--yarn',
        ]);

        let fixturePath = 'app/yarn';
        [
          'app/templates/application.hbs',
          '.travis.yml',
          'README.md',
          '.eslintrc.js',
        ].forEach(filePath => {
          expect(file(filePath))
            .to.equal(file(path.join(__dirname, '../fixtures', fixturePath, filePath)));
        });

        checkPackageJson(fixturePath);
      }));

      it('addon + npm + !welcome', co.wrap(function *() {
        yield ember([
          'addon',
          'foo',
          '--skip-npm',
          '--skip-bower',
          '--skip-git',
        ]);

        let fixturePath = 'addon/npm';
        [
          'config/ember-try.js',
          'tests/dummy/app/templates/application.hbs',
          '.travis.yml',
          'README.md',
          '.eslintrc.js',
        ].forEach(filePath => {
          expect(file(filePath))
            .to.equal(file(path.join(__dirname, '../fixtures', fixturePath, filePath)));
        });

        checkPackageJson(fixturePath);
      }));

      it('addon + yarn + welcome', co.wrap(function *() {
        yield ember([
          'addon',
          'foo',
          '--skip-npm',
          '--skip-bower',
          '--skip-git',
          '--yarn',
          '--welcome',
        ]);

        let fixturePath = 'addon/yarn';
        [
          'config/ember-try.js',
          'tests/dummy/app/templates/application.hbs',
          '.travis.yml',
          'README.md',
          '.eslintrc.js',
        ].forEach(filePath => {
          expect(file(filePath))
            .to.equal(file(path.join(__dirname, '../fixtures', fixturePath, filePath)));
        });

        checkPackageJson(fixturePath);
      }));
    }
  });

  describe('verify dependencies', function() {
    it('are locked down for pre-1.0 versions', co.wrap(function *() {
      yield ember([
        'new',
        'foo',
        '--skip-npm',
        '--skip-bower',
        '--skip-git',
        '--yarn',
        '--welcome',
      ]);

      let pkg = fs.readJsonSync('package.json');

      assertVersionLock(pkg.dependencies);
      assertVersionLock(pkg.devDependencies);
    }));
  });
});
