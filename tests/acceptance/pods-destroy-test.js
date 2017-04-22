'use strict';

const co = require('co');
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

  beforeEach(co.wrap(function *() {
    tmpdir = yield mkTmpDirIn(tmproot);
    process.chdir(tmpdir);
  }));

  afterEach(function() {
    this.timeout(10000);

    process.chdir(root);
    return remove(tmproot);
  });

  function initApp() {
    return ember([
      'init',
      '--name=my-app',
      '--skip-npm',
      '--skip-bower',
    ]);
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

  const assertDestroyAfterGenerate = co.wrap(function *(args, files) {
    yield initApp();

    replaceFile('config/environment.js', "(var|let|const) ENV = {", "$1 ENV = {\npodModulePrefix: 'app/pods', \n");

    yield generate(args);
    assertFilesExist(files);

    let result = yield destroy(args);
    expect(result, 'destroy command did not exit with errorCode').to.be.an('object');
    assertFilesNotExist(files);
  });

  const assertDestroyAfterGenerateWithUsePods = co.wrap(function *(args, files) {
    yield initApp();

    replaceFile('.ember-cli', '"disableAnalytics": false', '"disableAnalytics": false,\n"usePods" : true\n');

    yield generate(args);
    assertFilesExist(files);

    let result = yield destroy(args);
    expect(result, 'destroy command did not exit with errorCode').to.be.an('object');
    assertFilesNotExist(files);
  });

  const destroyAfterGenerateWithPodsByDefault = co.wrap(function *(args) {
    yield initApp();

    replaceFile('config/environment.js', "(var|let|const) ENV = {", "$1 ENV = {\nusePodsByDefault: true, \n");

    yield generate(args);
    return yield destroy(args);
  });

  const destroyAfterGenerate = co.wrap(function *(args) {
    yield initApp();

    replaceFile('config/environment.js', "(var|let|const) ENV = {", "$1 ENV = {\npodModulePrefix: 'app/pods', \n");

    yield generate(args);
    return yield destroy(args);
  });

  it('.ember-cli usePods setting destroys in pod structure without --pod flag', function() {
    let commandArgs = ['controller', 'foo'];
    let files = [
      'app/foo/controller.js',
      'tests/unit/foo/controller-test.js',
    ];

    return assertDestroyAfterGenerateWithUsePods(commandArgs, files);
  });

  it('.ember-cli usePods setting destroys in classic structure with --classic flag', function() {
    let commandArgs = ['controller', 'foo', '--classic'];
    let files = [
      'app/controllers/foo.js',
      'tests/unit/controllers/foo-test.js',
    ];

    return assertDestroyAfterGenerateWithUsePods(commandArgs, files);
  });

  it('.ember-cli usePods setting correctly destroys component', function() {
    let commandArgs = ['component', 'x-foo'];
    let files = [
      'app/components/x-foo/component.js',
      'app/components/x-foo/template.hbs',
      'tests/integration/components/x-foo/component-test.js',
    ];

    return assertDestroyAfterGenerateWithUsePods(commandArgs, files);
  });

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

  it('deletes files generated using blueprints from the project directory', co.wrap(function *() {
    let commandArgs = ['foo', 'bar', '--pod'];
    let files = ['app/foos/bar.js'];

    yield initApp();

    yield outputFile(
      'blueprints/foo/files/app/foos/__name__.js',
      "import Ember from 'ember';\n\n" +
      'export default Ember.Object.extend({ foo: true });\n'
    );

    yield generate(commandArgs);
    assertFilesExist(files);

    yield destroy(commandArgs);
    assertFilesNotExist(files);
  }));

  it('correctly identifies the root of the project', co.wrap(function *() {
    let commandArgs = ['controller', 'foo', '--pod'];
    let files = ['app/foo/controller.js'];

    yield initApp();

    yield outputFile(
      'blueprints/controller/files/app/__path__/__name__.js',
      "import Ember from 'ember';\n\n" +
      "export default Ember.Controller.extend({ custom: true });\n"
    );

    yield generate(commandArgs);
    assertFilesExist(files);

    process.chdir(path.join(tmpdir, 'app'));
    yield destroy(commandArgs);

    process.chdir(tmpdir);
    assertFilesNotExist(files);
  }));

  // Skip until podModulePrefix is deprecated
  it.skip('podModulePrefix deprecation warning', co.wrap(function *() {
    let result = yield destroyAfterGenerate(['controller', 'foo', '--pod']);

    expect(result.outputStream.join()).to.include("`podModulePrefix` is deprecated and will be" +
      " removed from future versions of ember-cli. Please move existing pods from" +
      " 'app/pods/' to 'app/'.");
  }));

  it('usePodsByDefault deprecation warning', co.wrap(function *() {
    let result = yield destroyAfterGenerateWithPodsByDefault(['controller', 'foo', '--pod']);

    expect(result.outputStream.join()).to.include('`usePodsByDefault` is no longer supported in' +
      ' \'config/environment.js\', use `usePods` in \'.ember-cli\' instead.');
  }));

});
