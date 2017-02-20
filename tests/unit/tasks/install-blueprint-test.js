'use strict';

const InstallBlueprintTask = require('../../../lib/tasks/install-blueprint');
const experiments = require('../../../lib/experiments');
const td = require('testdouble');
const SilentError = require('silent-error');
const expect = require('../../chai').expect;

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

    it('resolves "foobar" by looking up the "foobar" blueprint locally', function() {
      let foobarBlueprint = { name: 'foobar blueprint' };
      td.when(task._lookupBlueprint('foobar')).thenResolve(foobarBlueprint);

      return expect(task._resolveBlueprint('foobar'))
        .to.eventually.equal(foobarBlueprint);
    });

    if (!experiments.NPM_BLUEPRINTS) {
      it('rejects if the "foobar" blueprint was not found locally', function() {
        let error = new Error('foobar not found');
        td.when(task._lookupBlueprint('foobar')).thenReject(error);

        return expect(task._resolveBlueprint('foobar'))
          .to.be.rejectedWith(error);
      });

    } else {
      it('rejects invalid npm package name "foo:bar"', function() {
        let error = new Error('foobar not found');
        td.when(task._lookupBlueprint('foo:bar')).thenReject(error);

        return expect(task._resolveBlueprint('foo:bar'))
          .to.be.rejectedWith(error);
      });

      it('tries to resolve "foobar" as npm package as a fallback', function() {
        let error = new Error('foobar not found');
        td.when(task._lookupBlueprint('foobar')).thenReject(error);

        let foobarBlueprint = { name: 'foobar npm blueprint' };
        td.when(task._tryNpmBlueprint('foobar')).thenResolve(foobarBlueprint);

        return expect(task._resolveBlueprint('foobar'))
          .to.eventually.equal(foobarBlueprint);
      });

      it('rejects if npm module resolution failed', function() {
        let error = new Error('foobar not found');
        td.when(task._lookupBlueprint('foobar')).thenReject(error);

        let npmError = new Error('npm failure');
        td.when(task._tryNpmBlueprint('foobar')).thenReject(npmError);

        return expect(task._resolveBlueprint('foobar'))
          .to.be.rejectedWith(npmError);
      });
    }

    it('resolves "https://github.com/ember-cli/app-blueprint-test.git" blueprint by cloning, ' +
      'installing dependencies and loading the blueprint', function() {
      let url = 'https://github.com/ember-cli/app-blueprint-test.git';
      let gitBlueprint = { name: 'git blueprint' };
      td.when(task._gitClone(url, task._tempPath)).thenResolve();
      td.when(task._npmInstall(task._tempPath)).thenResolve();
      td.when(task._loadBlueprintFromPath(task._tempPath)).thenResolve(gitBlueprint);

      return expect(task._resolveBlueprint(url))
        .to.eventually.equal(gitBlueprint);
    });

    it('rejects if temp folder creation fails', function() {
      let url = 'https://github.com/ember-cli/app-blueprint-test.git';
      let error = new Error('temp folder creation failed');
      td.when(task._createTempFolder()).thenReject(error);

      return expect(task._resolveBlueprint(url))
        .to.be.rejectedWith(error);
    });

    it('rejects if "git clone" fails', function() {
      let url = 'https://github.com/ember-cli/app-blueprint-test.git';
      let error = new Error('git clone failed');
      td.when(task._gitClone(url, task._tempPath)).thenReject(error);

      return expect(task._resolveBlueprint(url))
        .to.be.rejectedWith(error);
    });

    it('rejects if "npm install" fails', function() {
      let url = 'https://github.com/ember-cli/app-blueprint-test.git';
      let error = new Error('npm install failed');
      td.when(task._gitClone(url, task._tempPath)).thenResolve();
      td.when(task._npmInstall(task._tempPath)).thenReject(error);

      return expect(task._resolveBlueprint(url))
        .to.be.rejectedWith(error);
    });

    it('rejects if loading the blueprint fails', function() {
      let url = 'https://github.com/ember-cli/app-blueprint-test.git';
      let error = new Error('loading blueprint failed');
      td.when(task._gitClone(url, task._tempPath)).thenResolve();
      td.when(task._npmInstall(task._tempPath)).thenResolve();
      td.when(task._loadBlueprintFromPath(task._tempPath)).thenReject(error);

      return expect(task._resolveBlueprint(url))
        .to.be.rejectedWith(error);
    });
  });

  describe('_tryNpmBlueprint', function() {
    beforeEach(function() {
      task._createTempFolder = td.function();
      task._npmInstallModule = td.function();
      task._validateNpmModule = td.function();
      task._loadBlueprintFromPath = td.function();

      task._tempPath = '/tmp/foobar';
      td.when(task._createTempFolder()).thenResolve(task._tempPath);
    });

    it('resolves with blueprint after successful "npm install"', function() {
      let modulePath = '/path/to/foobar';
      td.when(task._npmInstallModule('foobar', task._tempPath)).thenResolve(modulePath);

      let foobarBlueprint = { name: 'foobar blueprint' };
      td.when(task._loadBlueprintFromPath(modulePath)).thenResolve(foobarBlueprint);

      return expect(task._tryNpmBlueprint('foobar'))
        .to.eventually.equal(foobarBlueprint);
    });

    it('rejects with SilentError if npm module "foobar" could not be found', function() {
      let error = new Error();
      error.stderr = `
          npm ERR! 404 Registry returned 404 for GET on https://registry.npmjs.org/ember-cli-app-blueprint-tes
          npm ERR! 404
          npm ERR! 404  'foobar' is not in the npm registry.
          npm ERR! 404 You should bug the author to publish it (or use the name yourself!)
          npm ERR! 404
          npm ERR! 404 Note that you can also install from a
          npm ERR! 404 tarball, folder, http url, or git url.`;

      td.when(task._npmInstallModule('foobar', task._tempPath)).thenReject(error);

      return expect(task._tryNpmBlueprint('foobar'))
        .to.be.rejectedWith(SilentError, `The package 'foobar' was not found in the npm registry.`);
    });

    it('rejects if "npm install" fails', function() {
      let error = new Error('npm install failed');
      td.when(task._npmInstallModule('foobar', task._tempPath)).thenReject(error);

      return expect(task._tryNpmBlueprint('foobar'))
        .to.be.rejectedWith(error);
    });

    it('rejects if npm module validation fails', function() {
      let modulePath = '/path/to/foobar';
      td.when(task._npmInstallModule('foobar', task._tempPath)).thenResolve(modulePath);

      let error = new Error('module validation failed');
      td.when(task._validateNpmModule(modulePath, 'foobar')).thenThrow(error);

      return expect(task._tryNpmBlueprint('foobar'))
        .to.be.rejectedWith(error);
    });

    it('rejects if loading blueprint fails', function() {
      let modulePath = '/path/to/foobar';
      td.when(task._npmInstallModule('foobar', task._tempPath)).thenResolve(modulePath);

      let error = new Error('loading blueprint failed');
      td.when(task._loadBlueprintFromPath(modulePath)).thenReject(error);

      return expect(task._tryNpmBlueprint('foobar'))
        .to.be.rejectedWith(error);
    });
  });
});
