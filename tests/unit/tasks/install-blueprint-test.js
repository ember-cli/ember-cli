'use strict';

const InstallBlueprintTask = require('../../../lib/tasks/install-blueprint');
const td = require('testdouble');
const expect = require('../../chai').expect;

describe('InstallBlueprintTask', function() {
  let task;
  beforeEach(function() {
    task = new InstallBlueprintTask();
  });

  describe('_resolveBlueprint', function() {
    beforeEach(function() {
      task._lookupBlueprint = td.function();
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

    it('rejects if the "foobar" blueprint was not found locally', function() {
      let error = new Error('foobar not found');
      td.when(task._lookupBlueprint('foobar')).thenReject(error);

      return expect(task._resolveBlueprint('foobar'))
        .to.be.rejectedWith(error);
    });

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
});
