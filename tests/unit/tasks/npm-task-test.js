'use strict';

const NpmTask = require('../../../lib/tasks/npm-task');
const MockUI = require('console-ui/mock');
const expect = require('../../chai').expect;
const td = require('testdouble');
const SilentError = require('silent-error');

describe('NpmTask', function() {
  describe('checkNpmVersion()', function() {
    let task, ui, npmFn;

    beforeEach(function() {
      ui = new MockUI();
      npmFn = td.function();
      task = new NpmTask({ ui, npm: npmFn });
    });

    it('resolves when a compatible version is found', function() {
      td.when(npmFn(['--version'])).thenResolve({ stdout: '3.2.1' });

      return expect(task.checkNpmVersion()).to.be.fulfilled.then(() => {
        expect(ui.output).to.be.empty;
        expect(ui.errors).to.be.empty;
      });
    });

    it('resolves with warning when a newer version is found', function() {
      td.when(npmFn(['--version'])).thenResolve({ stdout: '5.0.0' });

      return expect(task.checkNpmVersion()).to.be.fulfilled.then(() => {
        expect(ui.output).to.contain('WARNING');
        expect(ui.errors).to.be.empty;
      });
    });

    it('rejects when an older version is found', function() {
      td.when(npmFn(['--version'])).thenResolve({ stdout: '2.9.9' });

      return expect(task.checkNpmVersion()).to.be.rejectedWith(SilentError, /npm install -g npm/).then(() => {
        expect(ui.output).to.be.empty;
        expect(ui.errors).to.be.empty;
      });
    });

    it('rejects when npm is not found', function() {
      let error = new Error('npm not found');
      error.code = 'ENOENT';

      td.when(npmFn(['--version'])).thenReject(error);

      return expect(task.checkNpmVersion()).to.be.rejectedWith(SilentError, /instructions at https:\/\/github.com\/npm\/npm/).then(() => {
        expect(ui.output).to.be.empty;
        expect(ui.errors).to.be.empty;
      });
    });

    it('rejects when npm returns an unreadable version', function() {
      td.when(npmFn(['--version'])).thenResolve({ stdout: '5' });

      return expect(task.checkNpmVersion()).to.be.rejectedWith(TypeError, /Invalid Version/).then(() => {
        expect(ui.output).to.be.empty;
        expect(ui.errors).to.be.empty;
      });
    });

    it('rejects when an unknown error is thrown', function() {
      td.when(npmFn(['--version'])).thenReject(new Error('foobar?'));

      return expect(task.checkNpmVersion()).to.be.rejectedWith('foobar?').then(() => {
        expect(ui.output).to.be.empty;
        expect(ui.errors).to.be.empty;
      });
    });
  });
});
