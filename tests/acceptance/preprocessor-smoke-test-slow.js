'use strict';

const path = require('path');
const fs = require('fs-extra');

const runCommand = require('../helpers/run-command');
const acceptance = require('../helpers/acceptance');
const DistChecker = require('../helpers/dist-checker');
const copyFixtureFiles = require('../helpers/copy-fixture-files');
let createTestTargets = acceptance.createTestTargets;
let teardownTestTargets = acceptance.teardownTestTargets;
let linkDependencies = acceptance.linkDependencies;
let cleanupRun = acceptance.cleanupRun;

const chai = require('../chai');
let expect = chai.expect;
let dir = chai.dir;

let appName = 'some-cool-app';
let appRoot;

describe('Acceptance: preprocessor-smoke-test', function () {
  this.timeout(360000);

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

  it('addons with standard preprocessors compile correctly', async function () {
    await copyFixtureFiles(`preprocessor-tests/app-with-addon-with-preprocessors`);

    let packageJsonPath = path.join(appRoot, 'package.json');
    let packageJson = fs.readJsonSync(packageJsonPath);
    packageJson.devDependencies['ember-cli-sass'] = 'latest';
    packageJson.devDependencies['ember-cool-addon'] = 'latest';
    fs.writeJsonSync(packageJsonPath, packageJson);

    await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

    let checker = new DistChecker(path.join(appRoot, 'dist'));

    expect(checker.contains('css', 'app styles included')).to.be;
    expect(checker.contains('css', 'addon styles included')).to.be;
  });

  it('addon registry entries are added in the proper order', async function () {
    await copyFixtureFiles(`preprocessor-tests/app-registry-ordering`);

    let packageJsonPath = path.join(appRoot, 'package.json');
    let packageJson = fs.readJsonSync(packageJsonPath);
    packageJson.devDependencies['first-dummy-preprocessor'] = 'latest';
    packageJson.devDependencies['second-dummy-preprocessor'] = 'latest';
    fs.writeJsonSync(packageJsonPath, packageJson);

    await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

    let checker = new DistChecker(path.join(appRoot, 'dist'));

    expect(checker.contains('js', 'replacedByPreprocessor'), 'token should have been replaced in app bundle').to.be;
    expect(checker.contains('js', '__SECOND_PREPROCESSOR_REPLACEMENT_TOKEN__'), 'token should not be contained').to.not
      .be;
    expect(checker.contains('js', '__FIRST_PREPROCESSOR_REPLACEMENT_TOKEN__'), 'token should not be contained').to.not
      .be;
  });

  it('addons without preprocessors compile correctly', async function () {
    await copyFixtureFiles(`preprocessor-tests/app-with-addon-without-preprocessors`);

    let packageJsonPath = path.join(appRoot, 'package.json');
    let packageJson = fs.readJsonSync(packageJsonPath);
    packageJson.devDependencies['ember-cli-sass'] = 'latest';
    packageJson.devDependencies['ember-cool-addon'] = 'latest';
    fs.writeJsonSync(packageJsonPath, packageJson);

    await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

    let checker = new DistChecker(path.join(appRoot, 'dist'));

    expect(checker.contains('css', 'app styles included')).to.be;
    expect(checker.contains('css', 'addon styles included')).to.be;
  });

  /*
    [ app ]  -> [ addon ] -> [ preprocessor addon ]
      |             |
      |             |--- preprocessor applies to this
      |
      |-- preprocessor should not apply to this
  */
  it('addons depending on preprocessor addon preprocesses addon but not app', async function () {
    await copyFixtureFiles(`preprocessor-tests/app-with-addon-with-preprocessors-2`);

    let packageJsonPath = path.join(appRoot, 'package.json');
    let packageJson = fs.readJsonSync(packageJsonPath);
    packageJson.devDependencies['ember-cool-addon'] = 'latest';
    fs.writeJsonSync(packageJsonPath, packageJson);

    await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

    let checker = new DistChecker(path.join(appRoot, 'dist'));

    expect(
      checker.contains('js', 'foo_in_app: __PREPROCESSOR_REPLACEMENT_TOKEN__'),
      'token should not have been replaced in app bundle'
    ).to.be;
    expect(
      checker.contains('js', 'foo_in_app: "replacedByPreprocessor"'),
      'token should not have been replaced in app bundle'
    ).to.not.be;

    expect(
      checker.contains('js', 'foo_in_addon: "replacedByPreprocessor"'),
      'token should have been replaced in vendor bundle'
    ).to.be;
    expect(
      checker.contains('js', 'foo_in_addon: __PREPROCESSOR_REPLACEMENT_TOKEN__'),
      'token should have been replaced in vendor bundle'
    ).to.not.be;
  });

  /*
    [ app ]  -> [ addon ] ->  [ addon ] -> [ preprocessor addon ]
      |             |             |
      |             |             |--- preprocessor applies to this
      |             |
      |             |-- preprocessor should not apply to this
      |
      |-- preprocessor should not apply to this
  */
  it('addon N levels deep depending on preprocessor preprocesses that parent addon only', async function () {
    await copyFixtureFiles(`preprocessor-tests/app-with-addon-with-preprocessors-3`);

    let packageJsonPath = path.join(appRoot, 'package.json');
    let packageJson = fs.readJsonSync(packageJsonPath);
    packageJson.devDependencies['ember-shallow-addon'] = 'latest';

    fs.writeJsonSync(packageJsonPath, packageJson);

    await runCommand(path.join('.', 'node_modules', 'ember-cli', 'bin', 'ember'), 'build');

    let checker = new DistChecker(path.join(appRoot, 'dist'));

    expect(
      checker.contains('js', 'foo_in_app: __PREPROCESSOR_REPLACEMENT_TOKEN__'),
      'token should not have been replaced in app bundle'
    ).to.be;
    expect(
      checker.contains('js', 'foo_in_app: "replacedByPreprocessor"'),
      'token should not have been replaced in app bundle'
    ).to.not.be;

    expect(
      checker.contains('js', 'deep: "replacedByPreprocessor"'),
      'token should have been replaced in deep component'
    ).to.be;
    expect(
      checker.contains('js', 'shallow: __PREPROCESSOR_REPLACEMENT_TOKEN__'),
      'token should not have been replaced in shallow component'
    ).to.be;
    expect(
      checker.contains('js', 'deep: __PREPROCESSOR_REPLACEMENT_TOKEN__'),
      'token should have been replaced in deep component'
    ).to.not.be;
    expect(
      checker.contains('js', 'shallow: "replacedByPreprocessor"'),
      'token should not have been replaced in shallow component'
    ).to.not.be;
  });
});
