'use strict';

const ember = require('../helpers/ember');
let root = process.cwd();
const tmp = require('tmp-promise');
const initApp = require('../helpers/init-app');
const generateUtils = require('../helpers/generate-utils');

const Blueprint = require('@ember-tooling/blueprint-model');
const BlueprintNpmTask = require('ember-cli-internal-test-helpers/lib/helpers/disable-npm-on-blueprint');

const { expect } = require('chai');
const { file } = require('chai-files');

describe('Acceptance: ember destroy with --in option', function () {
  this.timeout(20000);

  before(function () {
    BlueprintNpmTask.disableNPM(Blueprint);
  });

  after(function () {
    BlueprintNpmTask.restoreNPM(Blueprint);
  });

  beforeEach(async function () {
    const { path } = await tmp.dir();
    process.chdir(path);
  });

  afterEach(function () {
    this.timeout(10000);

    process.chdir(root);
  });

  function generate(args) {
    let generateArgs = ['generate'].concat(args);
    return ember(generateArgs);
  }

  function destroy(args) {
    let destroyArgs = ['destroy'].concat(args);
    return ember(destroyArgs);
  }

  function assertFilesExist(files) {
    files.forEach(function (f) {
      expect(file(f)).to.exist;
    });
  }

  function assertFilesNotExist(files) {
    files.forEach(function (f) {
      expect(file(f)).to.not.exist;
    });
  }

  const assertDestroyAfterGenerate = async function (args, addonPath, files) {
    await initApp();
    await generateUtils.inRepoAddon(addonPath);
    await generateUtils.tempBlueprint();
    await generate(args);

    assertFilesExist(files);

    let result = await destroy(args);
    expect(result, 'destroy command did not exit with errorCode').to.be.an('object');
    assertFilesNotExist(files);
  };

  it('blueprint foo --in lib/other-thing', function () {
    let addonPath = './lib/other-thing';
    let commandArgs = ['foo', 'bar', '--in', addonPath];
    let files = ['lib/other-thing/addon/foos/bar.js'];

    return assertDestroyAfterGenerate(commandArgs, addonPath, files);
  });

  it('blueprint foo --in ./non-lib/other-thing', function () {
    let addonPath = './non-lib/other-thing';
    let commandArgs = ['foo', 'bar', '--in', addonPath];
    let files = ['non-lib/other-thing/addon/foos/bar.js'];

    return assertDestroyAfterGenerate(commandArgs, addonPath, files);
  });

  it('blueprint foo --in non-lib/other-thing', function () {
    let addonPath = 'non-lib/other-thing';
    let commandArgs = ['foo', 'bar', '--in', addonPath];
    let files = ['non-lib/other-thing/addon/foos/bar.js'];

    return assertDestroyAfterGenerate(commandArgs, addonPath, files);
  });

  it('blueprint foo --in non-lib/nested/other-thing', function () {
    let addonPath = 'non-lib/nested/other-thing';
    let commandArgs = ['foo', 'bar', '--in', addonPath];
    let files = ['non-lib/nested/other-thing/addon/foos/bar.js'];

    return assertDestroyAfterGenerate(commandArgs, addonPath, files);
  });
});
