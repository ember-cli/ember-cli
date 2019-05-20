'use strict';

const path = require('path');
const fs = require('fs-extra');
const td = require('testdouble');
const SilentError = require('silent-error');

const expect = require('../../chai').expect;
const mkTmpDirIn = require('../../../lib/utilities/mk-tmp-dir-in');
const InstallBlueprintTask = require('../../../lib/tasks/install-blueprint');

let root = path.join(__dirname, '../../..');
let tmproot = path.join(root, 'tmp');

describe('InstallBlueprintTask', function() {
  let task;
  beforeEach(function() {
    task = new InstallBlueprintTask();
  });

  describe('_resolveBlueprint', function() {
    beforeEach(function() {
      task._lookupBlueprint = td.function();
      task._tryNpmBlueprint = td.function();
      task._createTempFolder = td.function();
      task._gitClone = td.function();
      task._npmInstall = td.function();
      task._loadBlueprintFromPath = td.function();

      task._tempPath = '/tmp/foobar';
      td.when(task._createTempFolder()).thenResolve(task._tempPath);
    });

    it('resolves "foobar" by looking up the "foobar" blueprint locally', async function() {
      let foobarBlueprint = { name: 'foobar blueprint' };
      td.when(task._lookupBlueprint('foobar')).thenResolve(foobarBlueprint);

      expect(await task._resolveBlueprint('foobar')).to.equal(foobarBlueprint);
    });

    it('rejects invalid npm package name "foo:bar"', async function() {
      let error = new Error('foobar not found');
      td.when(task._lookupBlueprint('foo:bar')).thenReject(error);

      await expect(task._resolveBlueprint('foo:bar')).to.be.rejectedWith(error);
    });

    it('tries to resolve "foobar" as npm package as a fallback', async function() {
      let error = new Error('foobar not found');
      td.when(task._lookupBlueprint('foobar')).thenReject(error);

      let foobarBlueprint = { name: 'foobar npm blueprint' };
      td.when(task._tryNpmBlueprint('foobar', 'latest')).thenResolve(foobarBlueprint);

      expect(await task._resolveBlueprint('foobar')).to.equal(foobarBlueprint);
    });

    it('tries to resolve "@foo/bar@1.2.3" as npm package with a scope and a version', async function() {
      let error = new Error('@foo/bar@1.2.3 not found');
      td.when(task._lookupBlueprint('@foo/bar@1.2.3')).thenReject(error);

      let foobarBlueprint = { name: 'foobar npm blueprint' };
      td.when(task._tryNpmBlueprint('@foo/bar', '1.2.3')).thenResolve(foobarBlueprint);

      expect(await task._resolveBlueprint('@foo/bar@1.2.3')).to.equal(foobarBlueprint);
    });

    it('rejects if npm module resolution failed', async function() {
      let error = new Error('foobar not found');
      td.when(task._lookupBlueprint('foobar')).thenReject(error);

      let npmError = new Error('npm failure');
      td.when(task._tryNpmBlueprint('foobar', 'latest')).thenReject(npmError);

      await expect(task._resolveBlueprint('foobar')).to.be.rejectedWith(npmError);
    });

    it(
      'resolves "https://github.com/ember-cli/app-blueprint-test.git" blueprint by cloning, ' +
        'installing dependencies and loading the blueprint',
      async function() {
        let url = 'https://github.com/ember-cli/app-blueprint-test.git';
        let gitBlueprint = { name: 'git blueprint' };
        td.when(task._gitClone(url, task._tempPath)).thenResolve();
        td.when(task._npmInstall(task._tempPath)).thenResolve();
        td.when(task._loadBlueprintFromPath(task._tempPath)).thenResolve(gitBlueprint);

        expect(await task._resolveBlueprint(url)).to.equal(gitBlueprint);
      }
    );

    it('rejects if temp folder creation fails', async function() {
      let url = 'https://github.com/ember-cli/app-blueprint-test.git';
      let error = new Error('temp folder creation failed');
      td.when(task._createTempFolder()).thenReject(error);

      await expect(task._resolveBlueprint(url)).to.be.rejectedWith(error);
    });

    it('rejects if "git clone" fails', function() {
      let url = 'https://github.com/ember-cli/app-blueprint-test.git';
      let error = new Error('git clone failed');
      td.when(task._gitClone(url, task._tempPath)).thenReject(error);

      return expect(task._resolveBlueprint(url)).to.be.rejectedWith(error);
    });

    it('rejects if "npm install" fails', async function() {
      let url = 'https://github.com/ember-cli/app-blueprint-test.git';
      let error = new Error('npm install failed');
      td.when(task._gitClone(url, task._tempPath)).thenResolve();
      td.when(task._npmInstall(task._tempPath)).thenReject(error);

      await expect(task._resolveBlueprint(url)).to.be.rejectedWith(error);
    });

    it('rejects if loading the blueprint fails', async function() {
      let url = 'https://github.com/ember-cli/app-blueprint-test.git';
      let error = new Error('loading blueprint failed');
      td.when(task._gitClone(url, task._tempPath)).thenResolve();
      td.when(task._npmInstall(task._tempPath)).thenResolve();
      td.when(task._loadBlueprintFromPath(task._tempPath)).thenReject(error);

      await expect(task._resolveBlueprint(url)).to.be.rejectedWith(error);
    });
  });

  describe('_tryNpmBlueprint', function() {
    beforeEach(async function() {
      task._createTempFolder = td.function();
      task._npmInstallModule = td.function();
      task._validateNpmModule = td.function();
      task._loadBlueprintFromPath = td.function();

      task._tempPath = '/tmp/foobar';
      td.when(task._createTempFolder()).thenResolve(task._tempPath);

      const tmpdir = await mkTmpDirIn(tmproot);

      task.project = { root: tmpdir };
      process.chdir(tmpdir);
    });

    afterEach(function() {
      process.chdir(root);
      return fs.remove(tmproot);
    });

    it('if .npmrc exists in the project root it copys it to tmp location', function() {
      let dir = 'foo';

      fs.writeFileSync(path.join(task.project.root, '.npmrc'), 'foo');

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }

      task._copyNpmrc(dir);
      expect(fs.existsSync(path.join(task.project.root, dir, '.npmrc'))).to.be.true;
    });

    it('if .npmrc does not exists in the project root it is not copied', function() {
      let dir = 'foo';

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }

      task._copyNpmrc(dir);
      expect(fs.existsSync(path.join(task.project.root, dir, '.npmrc'))).to.be.false;
    });

    it('resolves with blueprint after successful "npm install"', async function() {
      let modulePath = '/path/to/foobar';
      td.when(task._npmInstallModule('foobar', 'latest', task._tempPath)).thenResolve(modulePath);

      let foobarBlueprint = { name: 'foobar blueprint' };
      td.when(task._loadBlueprintFromPath(modulePath)).thenResolve(foobarBlueprint);

      expect(await task._tryNpmBlueprint('foobar', 'latest')).to.equal(foobarBlueprint);
    });

    it('resolves with blueprint after successful "npm install" with a scope and a version', async function() {
      let modulePath = '/path/to/@foo/bar';
      td.when(task._npmInstallModule('@foo/bar', '1.2.3', task._tempPath)).thenResolve(modulePath);

      let foobarBlueprint = { name: '@foo/bar blueprint' };
      td.when(task._loadBlueprintFromPath(modulePath)).thenResolve(foobarBlueprint);

      expect(await task._tryNpmBlueprint('@foo/bar', '1.2.3')).to.equal(foobarBlueprint);
    });

    it('rejects with SilentError if npm module "foobar" could not be found', async function() {
      let error = new Error();
      error.stderr = `
          npm ERR! 404 Registry returned 404 for GET on https://registry.npmjs.org/ember-cli-app-blueprint-tes
          npm ERR! 404
          npm ERR! 404  'foobar' is not in the npm registry.
          npm ERR! 404 You should bug the author to publish it (or use the name yourself!)
          npm ERR! 404
          npm ERR! 404 Note that you can also install from a
          npm ERR! 404 tarball, folder, http url, or git url.`;

      td.when(task._npmInstallModule('foobar', 'latest', task._tempPath)).thenReject(error);

      await expect(task._tryNpmBlueprint('foobar', 'latest')).to.be.rejectedWith(
        SilentError,
        `The package 'foobar' was not found in the npm registry.`
      );
    });

    it('rejects if "npm install" fails', async function() {
      let error = new Error('npm install failed');
      td.when(task._npmInstallModule('foobar', 'latest', task._tempPath)).thenReject(error);

      await expect(task._tryNpmBlueprint('foobar', 'latest')).to.be.rejectedWith(error);
    });

    it('rejects if npm module validation fails', async function() {
      let modulePath = '/path/to/foobar';
      td.when(task._npmInstallModule('foobar', 'latest', task._tempPath)).thenResolve(modulePath);

      let error = new Error('module validation failed');
      td.when(task._validateNpmModule(modulePath, 'foobar')).thenThrow(error);

      await expect(task._tryNpmBlueprint('foobar', 'latest')).to.be.rejectedWith(error);
    });

    it('rejects if loading blueprint fails', async function() {
      let modulePath = '/path/to/foobar';
      td.when(task._npmInstallModule('foobar', 'latest', task._tempPath)).thenResolve(modulePath);

      let error = new Error('loading blueprint failed');
      td.when(task._loadBlueprintFromPath(modulePath)).thenReject(error);

      await expect(task._tryNpmBlueprint('foobar', 'latest')).to.be.rejectedWith(error);
    });
  });
});
