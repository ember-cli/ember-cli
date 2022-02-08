'use strict';

const ember = require('../helpers/ember');
const fs = require('fs-extra');
const path = require('path');
let root = process.cwd();
let tmproot = path.join(root, 'tmp');
const mkTmpDirIn = require('../../lib/utilities/mk-tmp-dir-in');

const Blueprint = require('../../lib/models/blueprint');
const BlueprintNpmTask = require('ember-cli-internal-test-helpers/lib/helpers/disable-npm-on-blueprint');

const chai = require('../chai');
let expect = chai.expect;
let file = chai.file;

describe('Acceptance: ember destroy with typescript blueprints', function () {
  this.timeout(60000);
  let tmpdir;

  before(function () {
    BlueprintNpmTask.disableNPM(Blueprint);
  });

  after(function () {
    BlueprintNpmTask.restoreNPM(Blueprint);
  });

  beforeEach(async function () {
    tmpdir = await mkTmpDirIn(tmproot);
    process.chdir(tmpdir);
  });

  afterEach(function () {
    process.chdir(root);
    return fs.remove(tmproot);
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
    files.forEach(function (f) {
      expect(file(f)).to.exist;
    });
  }

  function assertFilesNotExist(files) {
    files.forEach(function (f) {
      expect(file(f)).to.not.exist;
    });
  }

  it('deletes JS files generated from typescript blueprints and transformed', async function () {
    let commandArgs = ['foo', 'bar'];
    let files = ['app/foos/bar.js'];
    await initApp();

    await fs.outputFile(
      'blueprints/foo/index.js',
      `module.exports = {
        shouldTransformTypeScript: true
      }`
    );

    await fs.outputFile(
      'blueprints/foo/files/app/foos/__name__.ts',
      "import Ember from 'ember';\n\n" + 'export default Ember.Object.extend({ foo: true });\n'
    );

    await generate(commandArgs);
    assertFilesExist(files);

    await destroy(commandArgs);
    assertFilesNotExist(files);
  });

  it('deletes TS files generated from typescript blueprints with --typescript', async function () {
    let commandArgs = ['foo', 'bar'];
    let files = ['app/foos/bar.ts'];
    await initApp();

    await fs.outputFile(
      'blueprints/foo/index.js',
      `module.exports = {
        shouldTransformTypeScript: true
      }`
    );

    await fs.outputFile(
      'blueprints/foo/files/app/foos/__name__.ts',
      "import Ember from 'ember';\n\n" + 'export default Ember.Object.extend({ foo: true });\n'
    );

    await generate([...commandArgs, '--typescript']);
    assertFilesExist(files);

    await destroy(commandArgs);
    assertFilesNotExist(files);
  });

  it('deletes TS files generated from typescript blueprints when --typescript is passed', async function () {
    let commandArgs = ['foo', 'bar', '--typescript'];
    let files = ['app/foos/bar.ts'];
    await initApp();

    await fs.outputFile(
      'blueprints/foo/index.js',
      `module.exports = {
        shouldTransformTypeScript: true
      }`
    );

    await fs.outputFile(
      'blueprints/foo/files/app/foos/__name__.ts',
      "import Ember from 'ember';\n\n" + 'export default Ember.Object.extend({ foo: true });\n'
    );

    await generate(commandArgs);
    assertFilesExist(files);

    await destroy(commandArgs);
    assertFilesNotExist(files);
  });

  it('deletes TS files generated from typescript blueprints in a typescript project', async function () {
    let commandArgs = ['foo', 'bar'];
    let files = ['app/foos/bar.ts'];
    await initApp();

    await fs.writeJson('.ember-cli', {
      isTypeScriptProject: true,
    });

    await fs.outputFile(
      'blueprints/foo/index.js',
      `module.exports = {
        shouldTransformTypeScript: true
      }`
    );

    await fs.outputFile(
      'blueprints/foo/files/app/foos/__name__.ts',
      "import Ember from 'ember';\n\n" + 'export default Ember.Object.extend({ foo: true });\n'
    );

    await generate(commandArgs);
    assertFilesExist(files);

    await destroy(commandArgs);
    assertFilesNotExist(files);
  });

  it('deletes TS files generated from typescript blueprints when {typescript: true} is present in .ember-cli', async function () {
    let commandArgs = ['foo', 'bar'];
    let files = ['app/foos/bar.ts'];
    await initApp();

    await fs.writeJson('.ember-cli', {
      typescript: true,
    });

    await fs.outputFile(
      'blueprints/foo/index.js',
      `module.exports = {
        shouldTransformTypeScript: true
      }`
    );

    await fs.outputFile(
      'blueprints/foo/files/app/foos/__name__.ts',
      "import Ember from 'ember';\n\n" + 'export default Ember.Object.extend({ foo: true });\n'
    );

    await generate(commandArgs);
    assertFilesExist(files);

    await destroy(commandArgs);
    assertFilesNotExist(files);
  });

  it('does not delete anything if --typescript is passed and there are no TS files', async function () {
    let commandArgs = ['foo', 'bar'];
    let files = ['app/foos/bar.js'];
    await initApp();

    await fs.outputFile(
      'blueprints/foo/index.js',
      `module.exports = {
        shouldTransformTypeScript: true
      }`
    );

    await fs.outputFile(
      'blueprints/foo/files/app/foos/__name__.ts',
      "import Ember from 'ember';\n\n" + 'export default Ember.Object.extend({ foo: true });\n'
    );

    await generate(commandArgs);
    assertFilesExist(files);

    await destroy([...commandArgs, '--typescript']);
    assertFilesExist(files);
  });

  it('does not delete anything if --no-typescript is passed and there are no JS files', async function () {
    let commandArgs = ['foo', 'bar'];
    let files = ['app/foos/bar.ts'];
    await initApp();

    await fs.outputFile(
      'blueprints/foo/index.js',
      `module.exports = {
        shouldTransformTypeScript: true
      }`
    );

    await fs.outputFile(
      'blueprints/foo/files/app/foos/__name__.ts',
      "import Ember from 'ember';\n\n" + 'export default Ember.Object.extend({ foo: true });\n'
    );

    await generate([...commandArgs, '--typescript']);
    assertFilesExist(files);

    await destroy([...commandArgs, '--no-typescript']);
    assertFilesExist(files);
  });

  describe('when JS and TS files are present', function () {
    it('deletes the TS file when --typescript is passed', async function () {
      let commandArgs = ['foo', 'bar'];
      let files = ['app/foos/bar.ts', 'app/foos/bar.js'];
      const [tsFile, jsFile] = files;
      await initApp();

      await fs.outputFile(
        'blueprints/foo/index.js',
        `module.exports = {
          shouldTransformTypeScript: true
        }`
      );

      await fs.outputFile(
        'blueprints/foo/files/app/foos/__name__.ts',
        "import Ember from 'ember';\n\n" + 'export default Ember.Object.extend({ foo: true });\n'
      );

      await generate(commandArgs);
      await generate([...commandArgs, '--typescript']);
      assertFilesExist(files);

      await destroy([...commandArgs, '--typescript']);
      assertFilesNotExist([tsFile]);
      assertFilesExist([jsFile]);
    });

    it('deletes the JS file when --no-typescript flag is passed', async function () {
      let commandArgs = ['foo', 'bar'];
      let files = ['app/foos/bar.ts', 'app/foos/bar.js'];
      const [tsFile, jsFile] = files;
      await initApp();

      await fs.outputFile(
        'blueprints/foo/index.js',
        `module.exports = {
          shouldTransformTypeScript: true
        }`
      );

      await fs.outputFile(
        'blueprints/foo/files/app/foos/__name__.ts',
        "import Ember from 'ember';\n\n" + 'export default Ember.Object.extend({ foo: true });\n'
      );

      await generate(commandArgs);
      await generate([...commandArgs, '--typescript']);
      assertFilesExist(files);

      await destroy([...commandArgs, '--no-typescript']);
      assertFilesNotExist([jsFile]);
      assertFilesExist([tsFile]);
    });

    it('deletes both files when no flags are passed', async function () {
      let commandArgs = ['foo', 'bar'];
      let files = ['app/foos/bar.ts', 'app/foos/bar.js'];
      await initApp();

      await fs.outputFile(
        'blueprints/foo/index.js',
        `module.exports = {
          shouldTransformTypeScript: true
        }`
      );

      await fs.outputFile(
        'blueprints/foo/files/app/foos/__name__.ts',
        "import Ember from 'ember';\n\n" + 'export default Ember.Object.extend({ foo: true });\n'
      );

      await generate(commandArgs);
      await generate([...commandArgs, '--typescript']);
      assertFilesExist(files);

      await destroy(commandArgs);
      assertFilesNotExist(files);
    });
  });
});
