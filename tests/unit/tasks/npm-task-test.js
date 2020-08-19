'use strict';

const NpmTask = require('../../../lib/tasks/npm-task');
const MockUI = require('console-ui/mock');
const expect = require('../../chai').expect;
const td = require('testdouble');
const SilentError = require('silent-error');

describe('NpmTask', function () {
  describe('checkNpmVersion', function () {
    let task, ui;

    beforeEach(function () {
      ui = new MockUI();
      task = new NpmTask({ ui });
      task.npm = td.function();
    });

    it('resolves when a compatible version is found', function () {
      td.when(task.npm(['--version'])).thenResolve({ stdout: '5.2.1' });

      return expect(task.checkNpmVersion()).to.be.fulfilled.then(() => {
        expect(ui.output).to.be.empty;
        expect(ui.errors).to.be.empty;
      });
    });

    it('resolves with warning when a newer version is found', function () {
      td.when(task.npm(['--version'])).thenResolve({ stdout: '7.0.0' });

      return expect(task.checkNpmVersion()).to.be.fulfilled.then(() => {
        expect(ui.output).to.contain('WARNING');
        expect(ui.errors).to.be.empty;
      });
    });

    it('rejects when an older version is found', function () {
      td.when(task.npm(['--version'])).thenResolve({ stdout: '2.9.9' });

      return expect(task.checkNpmVersion())
        .to.be.rejectedWith(SilentError, /npm install -g npm/)
        .then(() => {
          expect(ui.output).to.be.empty;
          expect(ui.errors).to.be.empty;
        });
    });

    it('rejects when npm is not found', function () {
      let error = new Error('npm not found');
      error.code = 'ENOENT';

      td.when(task.npm(['--version'])).thenReject(error);

      return expect(task.checkNpmVersion())
        .to.be.rejectedWith(SilentError, /instructions at https:\/\/github.com\/npm\/npm/)
        .then(() => {
          expect(ui.output).to.be.empty;
          expect(ui.errors).to.be.empty;
        });
    });

    it('rejects when npm returns an unreadable version', function () {
      td.when(task.npm(['--version'])).thenResolve({ stdout: '5' });

      return expect(task.checkNpmVersion())
        .to.be.rejectedWith(TypeError, /Invalid Version/)
        .then(() => {
          expect(ui.output).to.be.empty;
          expect(ui.errors).to.be.empty;
        });
    });

    it('rejects when an unknown error is thrown', function () {
      td.when(task.npm(['--version'])).thenReject(new Error('foobar?'));

      return expect(task.checkNpmVersion())
        .to.be.rejectedWith('foobar?')
        .then(() => {
          expect(ui.output).to.be.empty;
          expect(ui.errors).to.be.empty;
        });
    });
  });

  describe('checkYarn', function () {
    let task, ui;

    beforeEach(function () {
      ui = new MockUI();
      task = new NpmTask({ ui });
      task.yarn = td.function();
    });

    it('resolves when yarn <2.0.0 is found', function () {
      td.when(task.yarn(['--version'])).thenResolve({ stdout: '1.22.0' });

      return expect(task.checkYarn()).to.be.fulfilled.then(() => {
        expect(ui.output).to.be.empty;
        expect(ui.errors).to.be.empty;
      });
    });

    it('resolves with warning when yarn >=2.0.0 is found', function () {
      td.when(task.yarn(['--version'])).thenResolve({ stdout: '2.0.0' });

      return expect(task.checkYarn()).to.be.fulfilled.then(() => {
        expect(ui.output).to.contain('WARNING');
        expect(ui.errors).to.be.empty;
      });
    });

    it('rejects when yarn is not found', function () {
      let error = new Error('yarn not found');
      error.code = 'ENOENT';

      td.when(task.yarn(['--version'])).thenReject(error);

      return expect(task.checkYarn()).to.be.rejectedWith(
        SilentError,
        /instructions at https:\/\/classic.yarnpkg.com\/en\/docs\/install/
      );
    });

    it('rejects when an unknown error is thrown', function () {
      td.when(task.yarn(['--version'])).thenReject(new Error('foobar?'));

      return expect(task.checkYarn()).to.be.rejectedWith('foobar?');
    });
  });

  describe('findPackageManager', function () {
    let task;

    beforeEach(function () {
      task = new NpmTask();
      task.hasYarnLock = td.function();
      task.checkYarn = td.function();
      task.checkNpmVersion = td.function();
    });

    it('resolves when no yarn.lock file was found and npm is compatible', function () {
      td.when(task.hasYarnLock()).thenReturn(false);
      td.when(task.checkNpmVersion()).thenResolve();

      return expect(task.findPackageManager()).to.be.fulfilled;
    });

    it('resolves when no yarn.lock file was found and npm is incompatible', function () {
      td.when(task.hasYarnLock()).thenReturn(false);
      td.when(task.checkNpmVersion()).thenReject();

      return expect(task.findPackageManager()).to.be.rejected;
    });

    it('resolves when yarn.lock file and yarn were found', function () {
      td.when(task.hasYarnLock()).thenReturn(true);
      td.when(task.checkYarn()).thenResolve({ yarnVersion: '1.22.0' });

      expect(task.useYarn).to.be.undefined;
      return expect(task.findPackageManager()).to.eventually.have.property('yarnVersion', '1.22.0');
    });

    it('resolves when yarn.lock file was found, yarn was not found and npm is compatible', function () {
      td.when(task.hasYarnLock()).thenReturn(true);
      td.when(task.checkYarn()).thenReject();
      td.when(task.checkNpmVersion()).thenResolve();

      expect(task.useYarn).to.be.undefined;
      return expect(task.findPackageManager()).to.be.fulfilled.then(() => {
        expect(task.useYarn).to.not.be.true;
      });
    });

    it('rejects when yarn.lock file was found, yarn was not found and npm is incompatible', function () {
      td.when(task.hasYarnLock()).thenReturn(true);
      td.when(task.checkYarn()).thenReject();
      td.when(task.checkNpmVersion()).thenReject();

      return expect(task.findPackageManager()).to.be.rejected;
    });

    it('resolves when yarn is requested and found', function () {
      task.useYarn = true;

      td.when(task.checkYarn()).thenResolve({ yarnVersion: '1.22.0' });

      return expect(task.findPackageManager()).to.be.fulfilled;
    });

    it('rejects with SilentError when yarn is requested but not found', function () {
      task.useYarn = true;

      let error = new SilentError(
        'Ember CLI is now using yarn, but was not able to find it.\n' +
          'Please install yarn using the instructions at https://classic.yarnpkg.com/en/docs/install'
      );

      td.when(task.checkYarn()).thenReject(error);

      return expect(task.findPackageManager()).to.be.rejectedWith(
        SilentError,
        /instructions at https:\/\/classic.yarnpkg.com\/en\/docs\/install/
      );
    });

    it('rejects when yarn is requested and yarn check errors', function () {
      task.useYarn = true;

      td.when(task.checkYarn()).thenReject(new Error('foobar'));

      return expect(task.findPackageManager()).to.be.rejectedWith('foobar');
    });

    it('resolves when npm is requested and compatible', function () {
      task.useYarn = false;

      td.when(task.checkNpmVersion()).thenResolve();

      return expect(task.findPackageManager()).to.be.fulfilled;
    });

    it('rejects when npm is requested but incompatible', function () {
      task.useYarn = false;

      td.when(task.checkNpmVersion()).thenReject();

      return expect(task.findPackageManager()).to.be.rejected;
    });
  });

  describe('toYarnArgs', function () {
    let task;

    beforeEach(function () {
      task = new NpmTask();
      task.yarnVersion = '1.22.0';
    });

    it('correctly adds "--non-interactive" for yarn versions <2.0.0', function () {
      let args = task.toYarnArgs('install', {});
      expect(args).to.deep.equal(['install', '--non-interactive']);
    });

    it('skips "--non-interactive" for yarn versions >=2.0.0', function () {
      task.yarnVersion = '2.0.1';
      let args = task.toYarnArgs('install', {});
      expect(args).to.deep.equal(['install']);
    });

    it('converts "npm install --no-optional" to "yarn install --ignore-optional"', function () {
      let args = task.toYarnArgs('install', { optional: false });

      expect(args).to.deep.equal(['install', '--ignore-optional', '--non-interactive']);
    });

    it('converts "npm install --save foobar" to "yarn add foobar"', function () {
      let args = task.toYarnArgs('install', { save: true, packages: ['foobar'] });

      expect(args).to.deep.equal(['add', 'foobar', '--non-interactive']);
    });

    it('converts "npm install --save-dev --save-exact foo" to "yarn add --dev --exact foo"', function () {
      let args = task.toYarnArgs('install', {
        'save-dev': true,
        'save-exact': true,
        packages: ['foo'],
      });

      expect(args).to.deep.equal(['add', '--dev', '--exact', 'foo', '--non-interactive']);
    });

    it('converts "npm uninstall bar" to "yarn remove bar"', function () {
      let args = task.toYarnArgs('uninstall', { packages: ['bar'] });

      expect(args).to.deep.equal(['remove', 'bar', '--non-interactive']);
    });

    it('throws when "yarn install" is called with packages', function () {
      expect(() => task.toYarnArgs('install', { packages: ['foo'] })).to.throw(Error, /install foo/);
    });
  });
});
