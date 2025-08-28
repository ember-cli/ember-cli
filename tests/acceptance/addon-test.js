'use strict';

const fs = require('fs-extra');
const path = require('path');
const tmp = require('tmp-promise');

const { expect } = require('chai');
const { dir, file } = require('chai-files');
const { cloneDeep, get, set } = require('lodash');

const ember = require('../helpers/ember');

const { checkFile } = require('../helpers-internal/file-utils');

let root = process.cwd();

describe('Acceptance: ember addon', function () {
  this.timeout(300000);

  let ORIGINAL_PROCESS_ENV_CI;

  beforeEach(async function () {
    const { path } = await tmp.dir();

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

  it('ember addon with --directory uses given directory name and has correct package name', async function () {
    let workdir = process.cwd();

    await ember(['addon', 'foo', '--skip-npm', '--skip-git', '--directory=bar']);

    expect(dir(path.join(workdir, 'foo'))).to.not.exist;
    expect(dir(path.join(workdir, 'bar'))).to.exist;

    let cwd = process.cwd();
    expect(cwd).to.not.match(/foo/, 'does not use addon name for directory name');
    expect(cwd).to.match(/bar/, 'uses given directory name');

    let pkgJson = fs.readJsonSync('package.json');
    expect(pkgJson.name).to.equal('foo', 'uses addon name for package name');
  });

  it('ember addon @foo/bar when parent directory does not contain `foo`', async function () {
    await ember(['addon', '@foo/bar', '--skip-npm', '--skip-git']);

    let directoryName = path.basename(process.cwd());

    expect(directoryName).to.equal('foo-bar');

    let pkgJson = fs.readJsonSync('package.json');
    expect(pkgJson.name).to.equal('@foo/bar', 'uses addon name for package name');
  });

  it('ember addon @foo/bar when parent directory contains `foo`', async function () {
    let scopedDirectoryPath = path.join(process.cwd(), 'foo');
    fs.mkdirsSync(scopedDirectoryPath);
    process.chdir(scopedDirectoryPath);

    await ember(['addon', '@foo/bar', '--skip-npm', '--skip-git']);

    let directoryName = path.basename(process.cwd());

    expect(directoryName).to.equal('bar');

    let pkgJson = fs.readJsonSync('package.json');
    expect(pkgJson.name).to.equal('@foo/bar', 'uses addon name for package name');
  });

  it('ember addon generates the correct directory name in `CONTRIBUTING.md` for scoped package names', async function () {
    await ember(['addon', '@foo/bar', '--skip-npm', '--skip-git']);

    expect(file('CONTRIBUTING.md')).to.match(/- `cd foo-bar`/);
  });

  describe('verify fixtures', function () {
    function checkEslintConfig(fixturePath) {
      expect(file('eslint.config.mjs')).to.equal(
        file(path.join(__dirname, '../fixtures', fixturePath, 'eslint.config.mjs'))
      );
    }

    const currentVersion = require('../../package').version;

    function checkFileWithJSONReplacement(fixtureName, fileName, targetPath, value) {
      let fixturePath = path.join(__dirname, '../fixtures', fixtureName, fileName);
      let fixtureContents = fs.readFileSync(fixturePath, { encoding: 'utf-8' });
      let fixtureData = JSON.parse(fixtureContents);

      let candidateContents = fs.readFileSync(fileName, 'utf8');
      let candidateData = JSON.parse(candidateContents);

      if (process.env.WRITE_FIXTURES) {
        let newFixtureData = cloneDeep(candidateData);
        set(newFixtureData, targetPath, get(fixtureData, targetPath));
        fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
        fs.writeFileSync(fixturePath, `${JSON.stringify(newFixtureData, null, 2)}\n`, { encoding: 'utf-8' });
      }

      set(fixtureData, targetPath, value);

      expect(JSON.stringify(candidateData, null, 2)).to.equal(JSON.stringify(fixtureData, null, 2));
    }

    function checkEmberCLIBuild(fixtureName, fileName) {
      let fixturePath = path.join(__dirname, '../fixtures', fixtureName, fileName);
      let fixtureContents = fs.readFileSync(fixturePath, { encoding: 'utf-8' });
      expect(file(fileName)).to.equal(fixtureContents);
    }

    it('addon defaults', async function () {
      await ember(['addon', 'foo', '--skip-npm', '--skip-git']);

      let namespace = 'addon';
      let fixturePath = `${namespace}/defaults`;

      [
        'tests/dummy/config/ember-try.js',
        'tests/dummy/app/templates/application.hbs',
        '.github/workflows/ci.yml',
        'README.md',
        'CONTRIBUTING.md',
        '.ember-cli',
      ].forEach((filePath) => {
        checkFile(filePath, path.join(__dirname, '../fixtures', fixturePath, filePath));
      });

      checkFileWithJSONReplacement(fixturePath, 'package.json', 'devDependencies.ember-cli', `~${currentVersion}`);
      checkFileWithJSONReplacement(
        fixturePath,
        'tests/dummy/config/ember-cli-update.json',
        'packages[0].version',
        currentVersion
      );

      // option independent, but piggy-backing on an existing generate for speed
      checkEslintConfig(namespace);

      // ember addon without --lang flag (default) has no lang attribute in dummy index.html
      expect(file('tests/dummy/app/index.html')).to.contain('<html>');

      // no TypeScript files
      [
        'tsconfig.json',
        'tsconfig.declarations.json',
        'tests/dummy/app/config/environment.d.ts',
        'types/global.d.ts',
      ].forEach((filePath) => {
        expect(file(filePath)).to.not.exist;
      });
    });

    it('addon + yarn + welcome', async function () {
      await ember(['addon', 'foo', '--skip-npm', '--skip-git', '--yarn', '--welcome']);

      let fixturePath = 'addon/yarn';

      [
        'tests/dummy/config/ember-try.js',
        'tests/dummy/app/templates/application.hbs',
        '.github/workflows/ci.yml',
        'README.md',
        'CONTRIBUTING.md',
      ].forEach((filePath) => {
        checkFile(filePath, path.join(__dirname, '../fixtures', fixturePath, filePath));
      });

      checkFileWithJSONReplacement(fixturePath, 'package.json', 'devDependencies.ember-cli', `~${currentVersion}`);
      checkFileWithJSONReplacement(
        fixturePath,
        'tests/dummy/config/ember-cli-update.json',
        'packages[0].version',
        currentVersion
      );
    });

    it('addon + pnpm + welcome', async function () {
      await ember(['addon', 'foo', '--skip-npm', '--skip-git', '--pnpm', '--welcome']);

      let fixturePath = 'addon/pnpm';

      [
        'tests/dummy/config/ember-try.js',
        'tests/dummy/app/templates/application.hbs',
        '.github/workflows/ci.yml',
        'README.md',
        'CONTRIBUTING.md',
        '.npmrc',
      ].forEach((filePath) => {
        checkFile(filePath, path.join(__dirname, '../fixtures', fixturePath, filePath));
      });

      checkFileWithJSONReplacement(fixturePath, 'package.json', 'devDependencies.ember-cli', `~${currentVersion}`);
      checkFileWithJSONReplacement(
        fixturePath,
        'tests/dummy/config/ember-cli-update.json',
        'packages[0].version',
        currentVersion
      );
    });

    it('addon + typescript', async function () {
      await ember(['addon', 'foo', '--typescript', '--skip-npm', '--skip-git', '--yarn']);

      let fixturePath = 'addon/typescript';

      // check fixtures
      [
        '.ember-cli',
        'index.js',
        'tests/helpers/index.ts',
        'tsconfig.json',
        'tsconfig.declarations.json',
        'tests/dummy/app/config/environment.d.ts',
        'types/global.d.ts',
      ].forEach((filePath) => {
        checkFile(filePath, path.join(__dirname, '../fixtures', fixturePath, filePath));
      });
      checkFileWithJSONReplacement(
        fixturePath,
        'tests/dummy/config/ember-cli-update.json',
        'packages[0].version',
        currentVersion
      );
      checkFileWithJSONReplacement(fixturePath, 'package.json', 'devDependencies.ember-cli', `~${currentVersion}`);
      checkEmberCLIBuild(fixturePath, 'ember-cli-build.js');
      checkEslintConfig(fixturePath);
    });
  });
});
