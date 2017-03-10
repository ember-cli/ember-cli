'use strict';

const co = require('co');
const RSVP = require('rsvp');
const ember = require('../helpers/ember');
const fs = require('fs-extra');
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

describe('Acceptance: ember destroy', function() {
  this.timeout(60000);
  let tmpdir;

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

  function initAddon() {
    return ember([
      'addon',
      'my-addon',
      '--skip-npm',
      '--skip-bower',
    ]);
  }

  function initInRepoAddon() {
    return initApp().then(function() {
      return ember([
        'generate',
        'in-repo-addon',
        'my-addon',
      ]);
    });
  }

  function generate(args) {
    let generateArgs = ['generate'].concat(args);
    return ember(generateArgs);
  }

  function generateInAddon(args) {
    let generateArgs = ['generate'].concat(args);

    return initAddon().then(function() {
      return ember(generateArgs);
    });
  }

  function generateInRepoAddon(args) {
    let generateArgs = ['generate'].concat(args);

    return initInRepoAddon().then(function() {
      return ember(generateArgs);
    });
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

    yield generate(args);
    assertFilesExist(files);

    let result = yield destroy(args);
    expect(result, 'destroy command did not exit with errorCode').to.be.an('object');
    assertFilesNotExist(files);
  });

  const assertDestroyAfterGenerateInAddon = co.wrap(function *(args, files) {
    yield generateInAddon(args);
    assertFilesExist(files);

    let result = yield destroy(args);
    expect(result, 'destroy command did not exit with errorCode').to.be.an('object');
    assertFilesNotExist(files);
  });

  const assertDestroyAfterGenerateInRepoAddon = co.wrap(function *(args, files) {
    yield generateInRepoAddon(args);
    assertFilesExist(files);

    let result = yield destroy(args);
    expect(result, 'destroy command did not exit with errorCode').to.be.an('object');
    assertFilesNotExist(files);
  });

  const assertDestroyAfterGenerateInAddonDummy = co.wrap(function *(args, files) {
    args = args.concat('--dummy');

    yield generateInAddon(args);
    assertFilesExist(files);

    let result = yield destroy(args);
    expect(result, 'destroy command did not exit with errorCode').to.be.an('object');
    assertFilesNotExist(files);
  });

  it('in-addon component x-foo', function() {
    let commandArgs = ['component', 'x-foo'];
    let files = [
      'addon/components/x-foo.js',
      'addon/templates/components/x-foo.hbs',
      'app/components/x-foo.js',
      'tests/integration/components/x-foo-test.js',
    ];

    return assertDestroyAfterGenerateInAddon(commandArgs, files);
  });

  it('in-repo-addon component x-foo', function() {
    let commandArgs = ['component', 'x-foo', '--in-repo-addon=my-addon'];
    let files = [
      'lib/my-addon/addon/components/x-foo.js',
      'lib/my-addon/addon/templates/components/x-foo.hbs',
      'lib/my-addon/app/components/x-foo.js',
      'tests/integration/components/x-foo-test.js',
    ];

    return assertDestroyAfterGenerateInRepoAddon(commandArgs, files);
  });

  it('in-repo-addon component nested/x-foo', function() {
    let commandArgs = ['component', 'nested/x-foo', '--in-repo-addon=my-addon'];
    let files = [
      'lib/my-addon/addon/components/nested/x-foo.js',
      'lib/my-addon/addon/templates/components/nested/x-foo.hbs',
      'lib/my-addon/app/components/nested/x-foo.js',
      'tests/integration/components/nested/x-foo-test.js',
    ];

    return assertDestroyAfterGenerateInRepoAddon(commandArgs, files);
  });

  it('in-addon-dummy component x-foo', function() {
    let commandArgs = ['component', 'x-foo'];
    let files = [
      'tests/dummy/app/templates/components/x-foo.hbs',
      'tests/dummy/app/components/x-foo.js',
    ];

    return assertDestroyAfterGenerateInAddonDummy(commandArgs, files);
  });

  it('blueprint foo', function() {
    let commandArgs = ['blueprint', 'foo'];
    let files = ['blueprints/foo/index.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('blueprint foo/bar', function() {
    let commandArgs = ['blueprint', 'foo/bar'];
    let files = ['blueprints/foo/bar/index.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('http-mock foo', function() {
    let commandArgs = ['http-mock', 'foo'];
    let files = ['server/mocks/foo.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('http-proxy foo', function() {
    let commandArgs = ['http-proxy', 'foo', 'bar'];
    let files = ['server/proxies/foo.js'];

    return assertDestroyAfterGenerate(commandArgs, files);
  });

  it('deletes files generated using blueprints from the project directory', co.wrap(function *() {
    let commandArgs = ['foo', 'bar'];
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
    let commandArgs = ['controller', 'foo'];
    let files = ['app/controllers/foo.js'];
    yield initApp();

    yield outputFile(
      'blueprints/controller/files/app/controllers/__name__.js',
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

  it('http-mock <name> does not remove server/', co.wrap(function *() {
    yield initApp();
    yield generate(['http-mock', 'foo']);
    yield generate(['http-mock', 'bar']);
    yield destroy(['http-mock', 'foo']);

    expect(file('server/index.js')).to.exist;
  }));

});
