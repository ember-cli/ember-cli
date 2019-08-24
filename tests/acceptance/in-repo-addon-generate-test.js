'use strict';

const util = require('util');
const ember = require('../helpers/ember');
const fs = require('fs-extra');
const path = require('path');
let outputFile = util.promisify(fs.outputFile);
let remove = util.promisify(fs.remove);
let root = process.cwd();
let tmproot = path.join(root, 'tmp');
const Blueprint = require('../../lib/models/blueprint');
const BlueprintNpmTask = require('ember-cli-internal-test-helpers/lib/helpers/disable-npm-on-blueprint');
const mkTmpDirIn = require('../../lib/utilities/mk-tmp-dir-in');

const chai = require('../chai');
let expect = chai.expect;
let file = chai.file;

describe('Acceptance: ember generate in-repo-addon', function() {
  this.timeout(20000);

  before(function() {
    BlueprintNpmTask.disableNPM(Blueprint);
  });

  after(function() {
    BlueprintNpmTask.restoreNPM(Blueprint);
  });

  beforeEach(async function() {
    const tmpdir = await mkTmpDirIn(tmproot);
    return process.chdir(tmpdir);
  });

  afterEach(function() {
    process.chdir(root);
    return remove(tmproot);
  });

  function initApp() {
    return ember(['init', '--name=my-app', '--skip-npm', '--skip-bower']);
  }

  async function initInRepoAddon() {
    await initApp();
    return ember(['generate', 'in-repo-addon', 'my-addon']);
  }

  it('in-repo-addon blueprint foo inside alternate path', async function() {
    // build an app with an in-repo addon in a non-standard path
    await initApp();
    await ember(['generate', 'in-repo-addon', './non-lib/other-thing']);
    // generate in project blueprint to allow easier testing of in-repo generation
    await outputFile('blueprints/foo/files/__root__/foos/__name__.js', '/* whoah, empty foo! */');
    // confirm that we can generate into the non-lib path
    await ember(['generate', 'foo', 'bar', '--in-repo-addon=other-thing']);

    expect(file('non-lib/other-thing/addon/foos/bar.js')).to.exist;
  });

  it('in-repo-addon adds path to lib', async function() {
    await initInRepoAddon();

    expect(file('package.json')).to.contain('lib/my-addon');
  });
});
