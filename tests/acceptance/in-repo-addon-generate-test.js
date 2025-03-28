'use strict';

const ember = require('../helpers/ember');
const { outputFile } = require('fs-extra');
let root = process.cwd();
const Blueprint = require('../../lib/models/blueprint');
const BlueprintNpmTask = require('ember-cli-internal-test-helpers/lib/helpers/disable-npm-on-blueprint');
const tmp = require('tmp-promise');

const { expect } = require('chai');
const { file } = require('chai-files');

describe('Acceptance: ember generate in-repo-addon', function () {
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
    process.chdir(root);
  });

  function initApp() {
    return ember(['init', '--name=my-app', '--skip-npm']);
  }

  async function initInRepoAddon() {
    await initApp();
    return ember(['generate', 'in-repo-addon', 'my-addon']);
  }

  it('in-repo-addon blueprint foo inside alternate path', async function () {
    // build an app with an in-repo addon in a non-standard path
    await initApp();
    await ember(['generate', 'in-repo-addon', './non-lib/other-thing']);
    // generate in project blueprint to allow easier testing of in-repo generation
    await outputFile('blueprints/foo/files/__root__/foos/__name__.js', '/* whoah, empty foo! */');
    // confirm that we can generate into the non-lib path
    await ember(['generate', 'foo', 'bar', '--in-repo-addon=other-thing']);

    expect(file('non-lib/other-thing/addon/foos/bar.js')).to.exist;
  });

  it('in-repo-addon adds path to lib', async function () {
    await initInRepoAddon();

    expect(file('package.json')).to.contain('lib/my-addon');
  });
});
