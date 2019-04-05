'use strict';

const co = require('co');
const RSVP = require('rsvp');
const ember = require('../helpers/ember');
const fs = require('fs-extra');
const path = require('path');
let remove = RSVP.denodeify(fs.remove);
let root = process.cwd();
let tmproot = path.join(root, 'tmp');
const mkTmpDirIn = require('../../lib/utilities/mk-tmp-dir-in');
const initApp = require('../helpers/init-app');
const generateUtils = require('../helpers/generate-utils');

const Blueprint = require('../../lib/models/blueprint');
const BlueprintNpmTask = require('ember-cli-internal-test-helpers/lib/helpers/disable-npm-on-blueprint');

const chai = require('../chai');
let expect = chai.expect;
let file = chai.file;

describe('Acceptance: ember destroy with --in option', function() {
  let tmpdir;

  this.timeout(20000);

  before(function() {
    BlueprintNpmTask.disableNPM(Blueprint);
  });

  after(function() {
    BlueprintNpmTask.restoreNPM(Blueprint);
  });

  beforeEach(
    co.wrap(function*() {
      tmpdir = yield mkTmpDirIn(tmproot);
      process.chdir(tmpdir);
    })
  );

  afterEach(function() {
    this.timeout(10000);

    process.chdir(root);
    return remove(tmproot);
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
    files.forEach(function(f) {
      expect(file(f)).to.exist;
    });
  }

  function assertFilesNotExist(files) {
    files.forEach(function(f) {
      expect(file(f)).to.not.exist;
    });
  }

  const assertDestroyAfterGenerate = co.wrap(function*(args, addonPath, files) {
    yield initApp();
    yield generateUtils.inRepoAddon(addonPath);
    yield generateUtils.tempBlueprint();
    yield generate(args);

    assertFilesExist(files);

    let result = yield destroy(args);
    expect(result, 'destroy command did not exit with errorCode').to.be.an('object');
    assertFilesNotExist(files);
  });

  it('blueprint foo --in lib/other-thing', function() {
    let addonPath = './lib/other-thing';
    let commandArgs = ['foo', 'bar', '--in', addonPath];
    let files = ['lib/other-thing/addon/foos/bar.js'];

    return assertDestroyAfterGenerate(commandArgs, addonPath, files);
  });

  it('blueprint foo --in ./non-lib/other-thing', function() {
    let addonPath = './non-lib/other-thing';
    let commandArgs = ['foo', 'bar', '--in', addonPath];
    let files = ['non-lib/other-thing/addon/foos/bar.js'];

    return assertDestroyAfterGenerate(commandArgs, addonPath, files);
  });

  it('blueprint foo --in non-lib/other-thing', function() {
    let addonPath = 'non-lib/other-thing';
    let commandArgs = ['foo', 'bar', '--in', addonPath];
    let files = ['non-lib/other-thing/addon/foos/bar.js'];

    return assertDestroyAfterGenerate(commandArgs, addonPath, files);
  });

  it('blueprint foo --in non-lib/nested/other-thing', function() {
    let addonPath = 'non-lib/nested/other-thing';
    let commandArgs = ['foo', 'bar', '--in', addonPath];
    let files = ['non-lib/nested/other-thing/addon/foos/bar.js'];

    return assertDestroyAfterGenerate(commandArgs, addonPath, files);
  });
});
