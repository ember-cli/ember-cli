'use strict';

const co = require('co');
const fs = require('fs-extra');
const ember = require('../helpers/ember');
const path = require('path');
const tmp = require('ember-cli-internal-test-helpers/lib/helpers/tmp');
const chalk = require('chalk');
const fixturify = require('fixturify');
const minimatch = require('minimatch');
const detectIndent = require('detect-indent');
const processTemplate = require('../../lib/utilities/process-template');
const sortPackageJson = require('sort-package-json');

const chai = require('../chai');
let expect = chai.expect;
let file = chai.file;
let dir = chai.dir;
const assertVersionLock = require('../helpers/assert-version-lock');

let tmpDir = './tmp/new-test';

const NO_WELCOME_TEMPLATE = `<h2 id="title">Welcome to Ember</h2>

{{outlet}}`;

const WELCOME_TEMPLATE = `{{!-- The following component displays Ember's default welcome message. --}}
{{welcome-page}}
{{!-- Feel free to remove this! --}}

{{outlet}}`;

function patchPackageJSON(source, patch) {
  const indentation = detectIndent(source);
  const json = JSON.parse(source);

  patch(json);


  return `${JSON.stringify(sortPackageJson(json), null, indentation.indent)}\n`;
}

function hasWelcomeDependency(sourceManifest) {
  return patchPackageJSON(sourceManifest, manifest => {
    manifest.devDependencies['ember-welcome-page'] = '^3.0.0';
  });
}

function noWelcomeDependency(sourceManifest) {
  return patchPackageJSON(sourceManifest, manifest =>
    delete manifest.devDependencies['ember-welcome-page']
  );
}

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
      'bar',
      '--skip-npm',
      '--skip-bower',
      '--skip-git',
    ])).to.be.rejected;

    expect(dir('bar')).to.not.exist;
    expect(error.name).to.equal('SilentError');
    expect(error.message).to.equal(`You cannot use the ${chalk.green('new')} command inside an ember-cli project.`);

    expectGeneratedDirName('foo');

    expect(file('.ember-cli')).to.exist;
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

  describe('verify fixtures', function() {
    const muApp = options =>
      projectFixture('app/npm', {
        files: ['!app/**'],
        patches: projectFixture('module-unification-app/npm', options),
      });

    const yarnApp = options =>
      projectFixture(
        projectFixture('app/npm', {
          patches: projectFixture('app/yarn'),
        }),
        options
      );

    const yarnModuleUnificationApp = options =>
      yarnApp({
        files: ['!app/**'],
        patches: projectFixture('module-unification-app/npm', options),
      });

    it('ember new foo, where foo does not yet exist, works', co.wrap(function *() {
      yield ember([
        'new',
        'foo',
        '--skip-npm',
        '--skip-bower',
      ]);

      expectProject('foo', 'app/npm');
    }));

    it('MODULE_UNIFICATION=true ember new foo works', co.wrap(function *() {
      process.env.MODULE_UNIFICATION = 'true';
      yield ember([
        'new',
        'foo',
        '--skip-npm',
        '--skip-bower',
      ]);

      expectProject('foo', muApp());
    }));

    it('module-unification-app + !welcome', co.wrap(function *() {
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

      expectProject('foo', muApp({
        patches: {
          'src/ui/routes/application/template.hbs': NO_WELCOME_TEMPLATE,
          'package.json': noWelcomeDependency,
        },
      }));
    }));

    it('module-unification-app + yarn', co.wrap(function *() {
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

      expectProject('foo', yarnModuleUnificationApp());
    }));

    it('app + !welcome', co.wrap(function *() {
      const noWelcomeApp = projectFixture('app/npm', {
        patches: {
          'app/templates/application.hbs': NO_WELCOME_TEMPLATE,
          'package.json': noWelcomeDependency,
        },
      });

      yield ember([
        'new',
        'foo',
        '--skip-npm',
        '--skip-bower',
        '--skip-git',
        '--no-welcome',
      ]);

      expectProject('foo', noWelcomeApp);
    }));

    it('app + yarn', co.wrap(function *() {
      yield ember([
        'new',
        'foo',
        '--skip-npm',
        '--skip-bower',
        '--skip-git',
        '--yarn',
      ]);

      expectProject('foo', yarnApp());
    }));

    it('addon', co.wrap(function *() {
      yield ember([
        'addon',
        'foo',
        '--skip-npm',
        '--skip-bower',
        '--skip-git',
      ]);

      expectProject('foo', 'addon/npm');
    }));

    it('addon + welcome', co.wrap(function *() {
      yield ember([
        'addon',
        'foo',
        '--skip-npm',
        '--skip-bower',
        '--skip-git',
        '--welcome',
      ]);

      expectProject('foo', projectFixture('addon/npm', {
        patches: {
          'tests/dummy/app/templates/application.hbs': WELCOME_TEMPLATE,
          'package.json': hasWelcomeDependency,
        },
      }));
    }));

    it('addon + yarn', co.wrap(function *() {
      yield ember([
        'addon',
        'foo',
        '--skip-npm',
        '--skip-bower',
        '--skip-git',
        '--yarn',
      ]);

      expectProject('foo', projectFixture('addon/npm', {
        patches: projectFixture('addon/yarn'),
      }));
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

// borrowed from https://gist.github.com/ivan-kleshnin/301a7e96be6c8725567f6832a49042df
const isPlainObject = o => Object.prototype.toString.call(o) === "[object Object]";

const flattenFixturify = (obj, keys = []) =>
  Object.keys(obj).reduce((acc, key) =>
    Object.assign(acc, isPlainObject(obj[key])
      ? flattenFixturify(obj[key], keys.concat(key))
      : { [keys.concat(key).join("/")]: obj[key] }
    ),
  {});

function expectProject(projectName, fixture) {
  const output = loadFiles('.');
  fixture = projectFixture(fixture);

  expectGeneratedDirName(projectName);

  let missingFiles = [];

  const fixtureFilenames = Object.keys(fixture);
  fixtureFilenames.forEach(filename => {
    if (typeof output[filename] !== 'undefined') {
      expect(output[filename]).to.equal(fixture[filename]);
    } else {
      missingFiles.push(filename);
    }
  });
  let extraFiles = Object.keys(output).filter(filename => fixtureFilenames.indexOf(filename) === -1);

  expect(missingFiles, `some files are missing: ${JSON.stringify(missingFiles)}`).to.empty;
  expect(extraFiles, `extra files generated: ${JSON.stringify(extraFiles)}`).to.empty;
}

function expectGeneratedDirName(dirName) {
  let directory = path.basename(process.cwd());
  expect(directory).to.equal(dirName);
}

function projectFixture(fixture, options) {
  const emberCLIVersion = require('../../package').version;
  const year = (new Date()).getFullYear();

  options = options || {};

  options.variables = Object.assign({
    year,
    emberCLIVersion,
  }, options.variables || {});

  if (typeof fixture === 'string') {
    const fixturePath = path.join(__dirname, `../fixtures/${fixture}`);

    fixture = loadFiles(fixturePath);
  }

  if (options.files && typeof options.files.length !== 'undefined') {
    const matcher = options.files.length === 1
      ? options.files[0]
      : `{${options.files.join(',')}}`;

    Object.keys(fixture).forEach(filename => {
      const isWhitelisted = minimatch(filename, matcher, {
        matchBase: true,
        dot: true,
      });

      if (!isWhitelisted) {
        delete fixture[filename];
      }
    });
  }

  if (isPlainObject(options.patches)) {
    fixture = applyPatches(fixture, options.patches);
  }

  fixture = applyVariables(fixture, options.variables);

  return fixture;
}

function loadFiles(path) {
  return flattenFixturify(fixturify.readSync(path));
}

function applyVariables(fixture, variables) {
  for (let fName in fixture) {
    fixture[fName] = processTemplate(fixture[fName], variables);
  }

  return fixture;
}

function applyPatches(fixture, patches) {
  fixture = JSON.parse(JSON.stringify(fixture));

  for (let filename in patches) {
    const patch = patches[filename];

    if (typeof patch === 'function') {
      fixture[filename] = patch(fixture[filename]);
    } else if ([null, false].indexOf(patch) > -1) {
      delete fixture[filename];
    // @todo: handle `true`
    } else if (typeof patch === 'string') {
      fixture[filename] = patch;
    } else {
      throw new Error('patch must be a function, string or boolean');
    }
  }

  return fixture;
}
