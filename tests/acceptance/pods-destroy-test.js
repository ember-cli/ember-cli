'use strict';

const RSVP = require('rsvp');
const ember = require('../helpers/ember');
const fs = require('fs-extra');
const replaceFile = require('ember-cli-internal-test-helpers/lib/helpers/file-utils').replaceFile;
let outputFile = RSVP.denodeify(fs.outputFile);
const path = require('path');
let remove = RSVP.denodeify(fs.remove);
let root = process.cwd();
let tmproot = path.join(root, 'tmp');
const mkTmpDirIn = require('../../lib/utilities/mk-tmp-dir-in');

const Blueprint = require('../../lib/models/blueprint');
const BlueprintNpmTask = require('ember-cli-internal-test-helpers/lib/helpers/disable-npm-on-blueprint');

const chai = require('../chai');
let expect = chai.expect;
let file = chai.file;

describe('Acceptance: ember destroy pod', function() {
  let tmpdir;

  this.timeout(20000);

  before(function() {
    BlueprintNpmTask.disableNPM(Blueprint);
  });

  after(function() {
    BlueprintNpmTask.restoreNPM(Blueprint);
  });

  beforeEach(async function() {
    tmpdir = await mkTmpDirIn(tmproot);
    process.chdir(tmpdir);
  });

  afterEach(function() {
    this.timeout(10000);

    process.chdir(root);
    return remove(tmproot);
  });

  function initApp() {
    return ember(['init', '--name=my-app', '--skip-npm', '--skip-bower']);
  }

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

  const assertDestroyAfterGenerate = async function(args, files) {
    await initApp();

    replaceFile('config/environment.js', '(var|let|const) ENV = {', "$1 ENV = {\npodModulePrefix: 'app/pods', \n");

    await generate(args);
    assertFilesExist(files);

    let result = await destroy(args);
    expect(result, 'destroy command did not exit with errorCode').to.be.an('object');
    assertFilesNotExist(files);
  };

  const destroyAfterGenerate = async function(args) {
    await initApp();

    replaceFile('config/environment.js', '(var|let|const) ENV = {', "$1 ENV = {\npodModulePrefix: 'app/pods', \n");

    await generate(args);
    return await destroy(args);
  };

  it('blueprint foo --pod', function() {
    let commandArgs = ['blueprint', 'foo', '--pod'];
    let files = ['blueprints/foo/index.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('blueprint foo/bar --pod', function() {
    let commandArgs = ['blueprint', 'foo/bar', '--pod'];
    let files = ['blueprints/foo/bar/index.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('http-mock foo --pod', function() {
    let commandArgs = ['http-mock', 'foo', '--pod'];
    let files = ['server/mocks/foo.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('http-proxy foo --pod', function() {
    let commandArgs = ['http-proxy', 'foo', 'bar', '--pod'];
    let files = ['server/proxies/foo.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('deletes files generated using blueprints from the project directory', async function() {
    let commandArgs = ['foo', 'bar', '--pod'];
    let files = ['app/foos/bar.js'];

    await initApp();

    await outputFile(
      'blueprints/foo/files/app/foos/__name__.js',
      "import Ember from 'ember';\n\n" + 'export default Ember.Object.extend({ foo: true });\n'
    );

    await generate(commandArgs);
    assertFilesExist(files);

    await destroy(commandArgs);
    assertFilesNotExist(files);
  });

  // Skip until podModulePrefix is deprecated
  it.skip('podModulePrefix deprecation warning', async function() {
    let result = await destroyAfterGenerate(['controller', 'foo', '--pod']);

    expect(result.outputStream.join()).to.include(
      '`podModulePrefix` is deprecated and will be' +
        ' removed from future versions of ember-cli. Please move existing pods from' +
        " 'app/pods/' to 'app/'."
    );
  });
});
