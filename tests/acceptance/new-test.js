'use strict';

const fs = require('fs-extra');
const walkSync = require('walk-sync');
const path = require('path');
const tmp = require('tmp-promise');
let root = process.cwd();
const util = require('util');

const EOL = require('os').EOL;

const Blueprint = require('../../lib/models/blueprint');
const ember = require('../helpers/ember');
const hasGlobalYarn = require('../helpers/has-global-yarn');
const { DEPRECATIONS } = require('../../lib/debug');

const { isExperimentEnabled } = require('@ember-tooling/blueprint-model/utilities/experiments');

const { expect } = require('chai');
const { dir, file } = require('chai-files');

const { checkFile } = require('../helpers-internal/file-utils');
const {
  currentVersion,
  checkEslintConfig,
  checkFileWithJSONReplacement,
  checkEmberCLIBuild,
} = require('../helpers-internal/fixtures');

let tmpDir;

describe('Acceptance: ember new', function () {
  this.timeout(300000);
  let ORIGINAL_PROCESS_ENV_CI;

  beforeEach(async function () {
    const { path } = await tmp.dir();
    tmpDir = path;
    process.chdir(path);
    ORIGINAL_PROCESS_ENV_CI = process.env.CI;
  });

  afterEach(function () {
    if (ORIGINAL_PROCESS_ENV_CI === undefined) {
      delete process.env.CI;
    } else {
      process.env.CI = ORIGINAL_PROCESS_ENV_CI;
    }
    process.chdir(root);
  });

  function confirmBlueprintedForDir(blueprintDir, expectedAppDir = 'foo', typescript = false) {
    let blueprintPath = path.join(blueprintDir, 'files');
    // ignore TypeScript files
    let expected = walkSync(blueprintPath, {
      ignore: ['tsconfig.json', 'types', 'app/config'],
    }).map((name) => (typescript ? name : name.replace(/\.ts$/, '.js')));

    // This style of assertion can't handle conditionally available files
    if (expected.some((x) => x.endsWith('eslint.config.mjs'))) {
      expected = [...expected.filter((x) => !x.endsWith('eslint.config.mjs')), 'eslint.config.mjs'];
    }
    // GJS and GTS files are also conditionally available
    expected = expected.filter((x) => !x.endsWith('.gjs') && !x.endsWith('.gts'));

    let actual = walkSync('.').sort();
    let directory = path.basename(process.cwd());

    Object.keys(Blueprint.renamedFiles).forEach((srcFile) => {
      expected[expected.indexOf(srcFile)] = Blueprint.renamedFiles[srcFile];
    });

    expected.sort();

    // since the test is quite dynamic we want to make sure that the
    // directory and the expected aren't empty
    expect(directory).to.not.be.empty;
    expect(expected).to.not.be.empty;

    expect(directory).to.equal(expectedAppDir);
    expect(expected).to.deep.equal(
      actual,
      `${EOL} expected: ${util.inspect(expected)}${EOL} but got: ${util.inspect(actual)}`
    );
  }

  it('ember new adds ember-welcome-page by default', async function () {
    await ember(['new', 'foo', '--skip-npm', '--skip-git']);

    expect(file('package.json')).to.match(/"ember-welcome-page"/);

    expect(file('app/templates/application.hbs')).to.contain('<WelcomePage />');
  });

  it('ember new @foo/bar, when parent directory does not contain `foo`', async function () {
    await ember(['new', '@foo/bar', '--skip-npm']);

    confirmBlueprintedForDir(path.dirname(require.resolve('@ember-tooling/classic-build-app-blueprint')), 'foo-bar');
  });

  it('ember new @foo/bar, when direct parent directory contains `foo`', async function () {
    let scopedDirectoryPath = path.join(process.cwd(), 'foo');
    fs.mkdirsSync(scopedDirectoryPath);
    process.chdir(scopedDirectoryPath);

    await ember(['new', '@foo/bar', '--skip-npm']);

    confirmBlueprintedForDir(path.dirname(require.resolve('@ember-tooling/classic-build-app-blueprint')), 'bar');
  });

  it('ember new @foo/bar, when parent directory hierarchy contains `foo`', async function () {
    let scopedDirectoryPath = path.join(process.cwd(), 'foo', 'packages');
    fs.mkdirsSync(scopedDirectoryPath);
    process.chdir(scopedDirectoryPath);

    await ember(['new', '@foo/bar', '--skip-npm']);

    confirmBlueprintedForDir(path.dirname(require.resolve('@ember-tooling/classic-build-app-blueprint')), 'bar');
  });

  it('ember new --no-welcome skips installation of ember-welcome-page', async function () {
    await ember(['new', 'foo', '--skip-npm', '--skip-git', '--no-welcome']);

    expect(file('package.json')).not.to.match(/"ember-welcome-page"/);

    expect(file('app/templates/application.hbs')).to.contain('Welcome to Ember');
  });

  it('ember new generates the correct directory name in `README.md` for scoped package names', async function () {
    await ember(['new', '@foo/bar', '--skip-npm', '--skip-git']);

    expect(file('README.md')).to.match(/- `cd foo-bar`/);
  });

  // ember new foo --lang
  // -------------------------------
  // Good: Correct Usage
  it('ember new foo --lang=(valid code): no message + set `lang` in index.html', async function () {
    await ember(['new', 'foo', '--skip-npm', '--skip-git', '--lang=en-US']);
    expect(file('app/index.html')).to.contain('<html lang="en-US">');
  });

  // Edge Case: both valid code AND programming language abbreviation, possible misuse
  it('ember new foo --lang=(valid code + programming language abbreviation): emit warning + set `lang` in index.html', async function () {
    await ember(['new', 'foo', '--skip-npm', '--skip-git', '--lang=css']);
    expect(file('app/index.html')).to.contain('<html lang="css">');
  });

  // Misuse: possibly an attempt to set app programming language
  it('ember new foo --lang=(programming language): emit warning + do not set `lang` in index.html', async function () {
    await ember(['new', 'foo', '--skip-npm', '--skip-git', '--lang=JavaScript']);
    expect(file('app/index.html')).to.contain('<html>');
  });

  // Misuse: possibly an attempt to set app programming language
  it('ember new foo --lang=(programming language abbreviation): emit warning + do not set `lang` in index.html', async function () {
    await ember(['new', 'foo', '--skip-npm', '--skip-git', '--lang=JS']);
    expect(file('app/index.html')).to.contain('<html>');
  });

  // Misuse: possibly an attempt to set app programming language
  it('ember new foo --lang=(programming language file extension): emit warning + do not set `lang` in index.html', async function () {
    await ember(['new', 'foo', '--skip-npm', '--skip-git', '--lang=.js']);
    expect(file('app/index.html')).to.contain('<html>');
  });

  // Misuse: Invalid Country Code
  it('ember new foo --lang=(invalid code): emit warning + do not set `lang` in index.html', async function () {
    await ember(['new', 'foo', '--skip-npm', '--skip-git', '--lang=en-UK']);
    expect(file('app/index.html')).to.contain('<html>');
  });

  it('ember new npm blueprint with old version', async function () {
    await ember(['new', 'foo', '--blueprint', '@glimmer/blueprint@0.6.4', '--skip-npm']);

    expect(dir('src')).to.exist;
  });

  it('ember new foo, where foo does not yet exist, works', async function () {
    await ember(['new', 'foo', '--skip-npm']);

    confirmBlueprintedForDir(path.dirname(require.resolve('@ember-tooling/classic-build-app-blueprint')));
  });

  it('ember new foo, blueprint targets match the default ember-cli targets', async function () {
    await ember(['new', 'foo', '--skip-npm']);

    process.env.CI = true;
    const defaultTargets = ['last 1 Chrome versions', 'last 1 Firefox versions', 'last 1 Safari versions'];
    const blueprintTargets = require(path.resolve('config/targets.js')).browsers;
    expect(blueprintTargets).to.have.same.deep.members(defaultTargets);
  });

  it('ember new with app name creates new directory and has a dasherized package name', async function () {
    await ember(['new', 'FooApp', '--skip-npm', '--skip-git']);

    expect(dir('FooApp')).to.not.exist;
    expect(file('package.json')).to.exist;

    let pkgJson = fs.readJsonSync('package.json');
    expect(pkgJson.name).to.equal('foo-app');
  });

  it('Can create new ember project in an existing empty directory', async function () {
    fs.mkdirsSync('bar');

    await ember(['new', 'foo', '--skip-npm', '--skip-git', '--directory=bar']);
  });

  it('Cannot create new ember project in a populated directory', async function () {
    fs.mkdirsSync('bar');
    fs.writeFileSync(path.join('bar', 'package.json'), '{}');

    let error = await expect(ember(['new', 'foo', '--skip-npm', '--skip-git', '--directory=bar'])).to.be.rejected;

    expect(error.name).to.equal('SilentError');
    expect(error.message).to.equal("Directory 'bar' already exists.");
  });

  it('successfully runs `ember new` inside of an existing ember-cli project', async function () {
    await ember(['new', 'foo', '--skip-npm', '--skip-git']);
    confirmBlueprintedForDir(path.dirname(require.resolve('@ember-tooling/classic-build-app-blueprint')));

    await ember(['new', 'bar', '--skip-npm', '--skip-git']);
    confirmBlueprintedForDir(path.dirname(require.resolve('@ember-tooling/classic-build-app-blueprint')), 'bar');
  });

  it('ember new with blueprint uses the specified blueprint directory with a relative path', async function () {
    fs.mkdirsSync('my_blueprint/files');
    fs.writeFileSync('my_blueprint/files/gitignore', '');

    await ember(['new', 'foo', '--skip-npm', '--skip-git', '--blueprint=./my_blueprint']);

    confirmBlueprintedForDir(path.join(tmpDir, 'my_blueprint'));
  });

  it('ember new with blueprint uses the specified blueprint directory with an absolute path', async function () {
    fs.mkdirsSync('my_blueprint/files');
    fs.writeFileSync('my_blueprint/files/gitignore', '');

    await ember([
      'new',
      'foo',
      '--skip-npm',
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
      '--skip-git',
      '--blueprint=https://github.com/ember-cli/app-blueprint-test.git#named-ref',
    ]);

    expect(file('.named-ref')).to.exist;
  });

  it('ember new with shorthand git blueprint and ref checks out the blueprint with the correct ref and uses it', async function () {
    this.timeout(20000); // relies on GH network stuff

    await ember(['new', 'foo', '--skip-npm', '--skip-git', '--blueprint=ember-cli/app-blueprint-test#named-ref']);

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
    await ember(['new', 'foo', '--skip-npm'], {
      skipGit: false,
    });

    expect(dir('.git')).to.exist;
  });

  it('ember new with --dry-run does not create new directory', async function () {
    await ember(['new', 'foo', '--dry-run']);

    expect(process.cwd()).to.not.match(/foo/, 'does not change cwd to foo in a dry run');
    expect(dir('foo')).to.not.exist;
    expect(dir('.git')).to.not.exist;
  });

  it('ember new with --directory uses given directory name and has correct package name', async function () {
    let workdir = process.cwd();

    await ember(['new', 'foo', '--skip-npm', '--skip-git', '--directory=bar']);

    expect(dir(path.join(workdir, 'foo'))).to.not.exist;
    expect(dir(path.join(workdir, 'bar'))).to.exist;

    let cwd = process.cwd();
    expect(cwd).to.not.match(/foo/, 'does not use app name for directory name');
    expect(cwd).to.match(/bar/, 'uses given directory name');

    let pkgJson = fs.readJsonSync('package.json');
    expect(pkgJson.name).to.equal('foo', 'uses app name for package name');
  });

  if (!isExperimentEnabled('CLASSIC')) {
    it('embroider experiment creates the correct files', async function () {
      let ORIGINAL_PROCESS_ENV = process.env.EMBER_CLI_EMBROIDER;
      process.env['EMBER_CLI_EMBROIDER'] = 'true';
      await ember(['new', 'foo', '--skip-npm', '--skip-git']);

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
    if (DEPRECATIONS.EMBROIDER.isRemoved) {
      this.skip();
    }

    await ember(['new', 'foo', '--skip-npm', '--skip-git', '--embroider']);

    let pkgJson = fs.readJsonSync('package.json');
    expect(pkgJson.devDependencies['@embroider/compat']).to.exist;
    expect(pkgJson.devDependencies['@embroider/core']).to.exist;
    expect(pkgJson.devDependencies['@embroider/webpack']).to.exist;
  });

  describe('verify fixtures', function () {
    it('app defaults', async function () {
      await ember(['new', 'foo', '--skip-npm', '--skip-git']);

      let namespace = 'app';
      let fixturePath = `${namespace}/defaults`;

      ['app/templates/application.hbs', '.github/workflows/ci.yml', 'README.md', '.ember-cli'].forEach((filePath) => {
        checkFile(filePath, path.join(__dirname, '../fixtures', fixturePath, filePath));
      });

      if (isExperimentEnabled('EMBROIDER')) {
        fixturePath = `${namespace}/embroider`;
      }

      checkFileWithJSONReplacement(fixturePath, 'config/ember-cli-update.json', 'packages[0].version', currentVersion);
      checkFileWithJSONReplacement(fixturePath, 'package.json', 'devDependencies.ember-cli', `~${currentVersion}`);
      checkEmberCLIBuild(fixturePath, 'ember-cli-build.js');

      // option independent, but piggy-backing on an existing generate for speed
      checkEslintConfig(namespace);

      // ember new without --lang flag (default) has no lang attribute in index.html
      expect(file('app/index.html')).to.contain('<html>');

      // no TypeScript files
      [
        'tsconfig.json',
        'tsconfig.declarations.json',
        'app/config/environment.d.ts',
        'types/global.d.ts',
        'types/foo/index.d.ts',
      ].forEach((filePath) => {
        expect(file(filePath)).to.not.exist;
      });
    });

    it('app + npm + !welcome', async function () {
      await ember(['new', 'foo', '--skip-npm', '--skip-git', '--no-welcome']);

      let namespace = 'app';
      let fixturePath = `${namespace}/npm`;

      ['app/templates/application.hbs', '.github/workflows/ci.yml', 'README.md'].forEach((filePath) => {
        checkFile(filePath, path.join(__dirname, '../fixtures', fixturePath, filePath));
      });

      if (isExperimentEnabled('EMBROIDER')) {
        fixturePath = 'app/embroider-no-welcome';
      }

      checkFileWithJSONReplacement(fixturePath, 'config/ember-cli-update.json', 'packages[0].version', currentVersion);
      checkFileWithJSONReplacement(fixturePath, 'package.json', 'devDependencies.ember-cli', `~${currentVersion}`);
      // option independent, but piggy-backing on an existing generate for speed
      checkEslintConfig(namespace);
    });

    it('app + yarn + welcome', async function () {
      await ember(['new', 'foo', '--skip-npm', '--skip-git', '--yarn']);

      let fixturePath = 'app/yarn';

      ['app/templates/application.hbs', '.github/workflows/ci.yml', 'README.md'].forEach((filePath) => {
        checkFile(filePath, path.join(__dirname, '../fixtures', fixturePath, filePath));
      });

      if (isExperimentEnabled('EMBROIDER')) {
        fixturePath = 'app/embroider-yarn';
      }

      checkFileWithJSONReplacement(fixturePath, 'config/ember-cli-update.json', 'packages[0].version', currentVersion);
      checkFileWithJSONReplacement(fixturePath, 'package.json', 'devDependencies.ember-cli', `~${currentVersion}`);
    });

    it('app + pnpm + welcome', async function () {
      await ember(['new', 'foo', '--skip-npm', '--skip-git', '--pnpm']);

      let fixturePath = 'app/pnpm';

      ['app/templates/application.hbs', '.github/workflows/ci.yml', 'README.md'].forEach((filePath) => {
        checkFile(filePath, path.join(__dirname, '../fixtures', fixturePath, filePath));
      });

      if (isExperimentEnabled('EMBROIDER')) {
        fixturePath = 'app/embroider-pnpm';
      }

      checkFileWithJSONReplacement(fixturePath, 'config/ember-cli-update.json', 'packages[0].version', currentVersion);
      checkFileWithJSONReplacement(fixturePath, 'package.json', 'devDependencies.ember-cli', `~${currentVersion}`);
    });

    it('new - no CI provider', async function () {
      await ember(['new', 'foo', '--ci-provider=none', '--skip-install', '--skip-git']);

      expect(file('.github/workflows/ci.yml')).to.not.exist;
      expect(file('config/ember-cli-update.json')).to.include('--ci-provider=none');
    });

    it('app + strict', async function () {
      await ember(['new', 'foo', '--strict', '--skip-npm', '--skip-git']);

      let fixturePath = 'app/strict';

      // check fixtures
      ['app/templates/application.gjs', '.ember-cli'].forEach((filePath) => {
        checkFile(filePath, path.join(__dirname, '../fixtures', fixturePath, filePath));
      });

      expect(file('app/templates/application.gts')).to.not.exist;
      expect(file('app/templates/application.hbs')).to.not.exist;
    });

    it('app + strict + typescript', async function () {
      await ember(['new', 'foo', '--typescript', '--strict', '--skip-npm', '--skip-git']);

      let fixturePath = 'app/strict-typescript';

      // check fixtures
      ['app/templates/application.gts', '.ember-cli'].forEach((filePath) => {
        checkFile(filePath, path.join(__dirname, '../fixtures', fixturePath, filePath));
      });

      expect(file('app/templates/application.gjs')).to.not.exist;
      expect(file('app/templates/application.hbs')).to.not.exist;
    });

    it('app + typescript', async function () {
      // we have to use yarn here, as npm fails on unresolvable peer dependencies, see https://github.com/emberjs/ember-test-helpers/issues/1236
      await ember(['new', 'foo', '--typescript', '--skip-npm', '--skip-git', '--yarn']);

      let fixturePath;
      if (isExperimentEnabled('EMBROIDER')) {
        fixturePath = 'app/typescript-embroider';
      } else {
        fixturePath = 'app/typescript';
      }

      // check fixtures
      [
        '.ember-cli',
        'tests/helpers/index.ts',
        'tsconfig.json',
        'app/config/environment.d.ts',
        'types/global.d.ts',
      ].forEach((filePath) => {
        checkFile(filePath, path.join(__dirname, '../fixtures', fixturePath, filePath));
      });
      checkFileWithJSONReplacement(fixturePath, 'config/ember-cli-update.json', 'packages[0].version', currentVersion);
      checkFileWithJSONReplacement(fixturePath, 'package.json', 'devDependencies.ember-cli', `~${currentVersion}`);
      checkEmberCLIBuild(fixturePath, 'ember-cli-build.js');
      checkEslintConfig(fixturePath);

      expect(file('tsconfig.declarations.json')).to.not.exist;
    });

    it('app + no-ember-data', async function () {
      await ember(['new', 'foo', '--no-ember-data', '--skip-npm', '--skip-git']);

      let fixturePath;
      if (isExperimentEnabled('EMBROIDER')) {
        fixturePath = 'app/embroider-no-ember-data';
      } else {
        fixturePath = 'app/no-ember-data';
      }

      checkFileWithJSONReplacement(fixturePath, 'config/ember-cli-update.json', 'packages[0].version', currentVersion);
      checkFileWithJSONReplacement(fixturePath, 'package.json', 'devDependencies.ember-cli', `~${currentVersion}`);
      checkEmberCLIBuild(fixturePath, 'ember-cli-build.js');
    });

    it('app + typescript + no-ember-data', async function () {
      await ember(['new', 'foo', '--typescript', '--no-ember-data', '--skip-npm', '--skip-git']);

      let fixturePath;
      if (isExperimentEnabled('EMBROIDER')) {
        fixturePath = 'app/typescript-embroider-no-ember-data';
      } else {
        fixturePath = 'app/typescript-no-ember-data';
      }

      checkFileWithJSONReplacement(fixturePath, 'config/ember-cli-update.json', 'packages[0].version', currentVersion);
      checkFileWithJSONReplacement(fixturePath, 'package.json', 'devDependencies.ember-cli', `~${currentVersion}`);
      checkEmberCLIBuild(fixturePath, 'ember-cli-build.js');
    });
  });
});
