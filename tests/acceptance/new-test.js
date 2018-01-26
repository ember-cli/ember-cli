'use strict';

const co = require('co');
const fs = require('fs-extra');
const ember = require('../helpers/ember');
const path = require('path');
const tmp = require('ember-cli-internal-test-helpers/lib/helpers/tmp');
const chalk = require('chalk');
const fixturify = require('fixturify');

const chai = require('../chai');
let expect = chai.expect;
let file = chai.file;
let dir = chai.dir;
const assertVersionLock = require('../helpers/assert-version-lock');

let tmpDir = './tmp/new-test';

// borrowed from https://gist.github.com/ivan-kleshnin/301a7e96be6c8725567f6832a49042df
const isPlainObj = o => Object.prototype.toString.call(o) === "[object Object]";
const flattenFixture = (obj, keys = []) =>
  Object.keys(obj).reduce((acc, key) =>
    Object.assign(acc, isPlainObj(obj[key])
      ? flattenFixture(obj[key], keys.concat(key))
      : { [keys.concat(key).join("/")]: obj[key] }
    ),
  {});

describe('Acceptance: ember new', function() {
  this.timeout(10000);

  beforeEach(co.wrap(function *() {
    yield tmp.setup(tmpDir);
    process.chdir(tmpDir);
  }));

  afterEach(function() {
    process.env.MODULE_UNIFICATION = undefined;
    return tmp.teardown(tmpDir);
  });

  function expectGeneratedDirName(dirName) {
    let directory = path.basename(process.cwd());
    expect(directory).to.equal(dirName);
  }

  function expectBlueprinted(fixturePath, options) {
    options = Object.assign({
      files: [],
    }, options || {});

    let fixture = flattenFixture(loadProjectFixture(path.join(__dirname, `../fixtures/${fixturePath}`)));
    let output = flattenFixture(fixturify.readSync('.'));

    if (options.files && options.files.length) {
      output = options.files.map(filepath => output[filepath]);
      fixture = options.files.map(filepath => fixture[filepath]);
    } else {
      output = JSON.parse(JSON.stringify(output));
      fixture = JSON.parse(JSON.stringify(fixture));
    }

    expect(output).to.deep.equal(fixture);
  }

  function loadProjectFixture(fixturePath) {
    let fixture = fixturify.readSync(fixturePath);

    let currentVersion = require('../../package').version;
    fixture['package.json'] = fixture['package.json'].replace("<%= emberCLIVersion %>", currentVersion);

    return fixture;
  }

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
      '--no-welcome',
    ]);

    let error = yield expect(ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      '--no-welcome',
    ])).to.be.rejected;

    expect(dir('foo')).to.not.exist;
    expect(error.name).to.equal('SilentError');
    expect(error.message).to.equal(`You cannot use the ${chalk.green('new')} command inside an ember-cli project.`);

    expectGeneratedDirName('foo');
    expectBlueprinted('app/npm');
  }));

  it('ember new with blueprint uses the specified blueprint directory with a relative path', co.wrap(function *() {
    fixturify.writeSync('./my_blueprint/files', {
      '.ember-cli': '',
    });

    yield ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      '--blueprint=./my_blueprint',
    ]);

    expectGeneratedDirName('foo');

    expect(file('.ember-cli')).to.exist;
  }));

  it('ember new with blueprint uses the specified blueprint directory with an absolute path', co.wrap(function *() {
    fixturify.writeSync('./my_blueprint/files', {
      '.ember-cli': '',
    });

    yield ember([
      'new',
      'foo',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
      `--blueprint=${path.resolve(process.cwd(), 'my_blueprint')}`,
    ]);

    expectGeneratedDirName('foo');

    expect(file('.ember-cli')).to.exist;
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

  describe('verify fixtures', function() {

    it('ember new foo, where foo does not yet exist, works', co.wrap(function *() {
      yield ember([
        'new',
        'foo',
        '--skip-npm',
        '--skip-bower',
        '--no-welcome',
      ]);

      expectGeneratedDirName('foo');

      expectBlueprinted('app/npm');
    }));

    it('MODULE_UNIFICATION=true ember new foo works', co.wrap(function *() {
      process.env.MODULE_UNIFICATION = 'true';
      yield ember([
        'new',
        'foo',
        '--skip-npm',
        '--skip-bower',
        '--no-welcome',
      ]);

      expectGeneratedDirName('foo');

      expectBlueprinted('module-unification-app/npm');
    }));

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

      expectBlueprinted('module-unification-app/npm', {
        files: [
          'src/ui/routes/application/template.hbs',
          '.travis.yml',
          'README.md',
        ],
      });
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

      expectBlueprinted('module-unification-app/yarn', {
        files: [
          'src/ui/routes/application/template.hbs',
          '.travis.yml',
          'README.md',
        ],
      });
    }));

    it('app + npm + !welcome', co.wrap(function *() {
      yield ember([
        'new',
        'foo',
        '--skip-npm',
        '--skip-bower',
        '--skip-git',
        '--no-welcome',
      ]);

      expectBlueprinted('app/npm', {
        files: [
          'app/templates/application.hbs',
          '.travis.yml',
          'README.md',
        ],
      });
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

      expectBlueprinted('app/yarn', {
        files: [
          'app/templates/application.hbs',
          '.travis.yml',
          'README.md',
        ],
      });
    }));

    it('addon + npm + !welcome', co.wrap(function *() {
      yield ember([
        'addon',
        'foo',
        '--skip-npm',
        '--skip-bower',
        '--skip-git',
      ]);

      expectBlueprinted('addon/npm', {
        files: [
          'config/ember-try.js',
          'tests/dummy/app/templates/application.hbs',
          '.travis.yml',
          'README.md',
          '.eslintrc.js',
          'package.json',
        ],
      });
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

      expectBlueprinted('addon/yarn', {
        files: [
          'config/ember-try.js',
          'tests/dummy/app/templates/application.hbs',
          '.travis.yml',
          'README.md',
          '.eslintrc.js',
          'package.json',
        ],
      });
    }));
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
