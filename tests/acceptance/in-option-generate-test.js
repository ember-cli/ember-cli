'use strict';

const ember = require('../helpers/ember');
const fs = require('fs-extra');
const path = require('path');
let root = process.cwd();
let tmproot = path.join(root, 'tmp');
const Blueprint = require('../../lib/models/blueprint');
const BlueprintNpmTask = require('ember-cli-internal-test-helpers/lib/helpers/disable-npm-on-blueprint');
const mkTmpDirIn = require('../helpers/mk-tmp-dir-in');
const initApp = require('../helpers/init-app');
const generateUtils = require('../helpers/generate-utils');

const { expect } = require('chai');
const { file } = require('chai-files');

describe('Acceptance: ember generate with --in option', function () {
  this.timeout(20000);

  before(function () {
    BlueprintNpmTask.disableNPM(Blueprint);
  });

  after(function () {
    BlueprintNpmTask.restoreNPM(Blueprint);
  });

  beforeEach(function () {
    return mkTmpDirIn(tmproot).then(function (tmpdir) {
      process.chdir(tmpdir);
    });
  });

  afterEach(function () {
    process.chdir(root);
    return fs.remove(tmproot);
  });

  function removeAddonPath() {
    let packageJsonPath = path.join(process.cwd(), 'package.json');
    let packageJson = fs.readJsonSync(packageJsonPath);

    delete packageJson['ember-addon'].paths;

    return fs.writeJsonSync(packageJsonPath, packageJson);
  }

  it('generate blueprint foo using lib', async function () {
    // build an app with an in-repo addon in a non-standard path
    await initApp();
    await generateUtils.inRepoAddon('lib/other-thing');
    await generateUtils.tempBlueprint();
    await ember(['generate', 'foo', 'bar', '--in=lib/other-thing']);

    expect(file('lib/other-thing/addon/foos/bar.js')).to.exist;
  });

  it('generate blueprint foo using custom path using current directory', async function () {
    // build an app with an in-repo addon in a non-standard path
    await initApp();
    await generateUtils.inRepoAddon('./non-lib/other-thing');
    await generateUtils.tempBlueprint();
    await ember(['generate', 'foo', 'bar', '--in=non-lib/other-thing']);

    expect(file('non-lib/other-thing/addon/foos/bar.js')).to.exist;
  });

  it('generate blueprint foo using custom path', async function () {
    // build an app with an in-repo addon in a non-standard path
    await initApp();
    await generateUtils.inRepoAddon('./non-lib/other-thing');
    // generate in project blueprint to allow easier testing of in-repo generation
    await generateUtils.tempBlueprint();
    await ember(['generate', 'foo', 'bar', '--in=./non-lib/other-thing']);

    // confirm that we can generate into the non-lib path
    expect(file('non-lib/other-thing/addon/foos/bar.js')).to.exist;
  });

  it('generate blueprint foo using custom nested path', async function () {
    // build an app with an in-repo addon in a non-standard path
    await initApp();
    await generateUtils.inRepoAddon('./non-lib/nested/other-thing');
    await generateUtils.tempBlueprint();
    await ember(['generate', 'foo', 'bar', '--in=./non-lib/nested/other-thing']);

    expect(file('non-lib/nested/other-thing/addon/foos/bar.js')).to.exist;
  });

  it('generate blueprint foo using sibling path', async function () {
    // build an app with an in-repo addon in a non-standard path
    await initApp();
    await fs.mkdirp('../sibling');
    await generateUtils.inRepoAddon('../sibling');
    await removeAddonPath();
    await generateUtils.tempBlueprint();
    await ember(['generate', 'foo', 'bar', '--in=../sibling']);

    expect(file('../sibling/addon/foos/bar.js')).to.exist;
  });
});
