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

    it('resolves when a compatible version is found', async function () {
      td.when(task.npm(['--version'])).thenResolve({ stdout: '5.2.1' });

      await task.checkNpmVersion();
      expect(ui.output).to.be.empty;
      expect(ui.errors).to.be.empty;
    });

    it('resolves with warning when a newer version is found', async function () {
      td.when(task.npm(['--version'])).thenResolve({ stdout: '7.0.0' });

      await task.checkNpmVersion();
      expect(ui.output).to.contain('WARNING');
      expect(ui.errors).to.be.empty;
    });

    it('rejects when an older version is found', async function () {
      td.when(task.npm(['--version'])).thenResolve({ stdout: '2.9.9' });

      await expect(task.checkNpmVersion()).to.be.rejectedWith(SilentError, /npm install -g npm/);
      expect(ui.output).to.be.empty;
      expect(ui.errors).to.be.empty;
    });

    it('rejects when npm is not found', async function () {
      let error = new Error('npm not found');
      error.code = 'ENOENT';

      td.when(task.npm(['--version'])).thenReject(error);

      await expect(task.checkNpmVersion()).to.be.rejectedWith(
        SilentError,
        /instructions at https:\/\/github.com\/npm\/npm/
      );
      expect(ui.output).to.be.empty;
      expect(ui.errors).to.be.empty;
    });

    it('rejects when npm returns an unreadable version', async function () {
      td.when(task.npm(['--version'])).thenResolve({ stdout: '5' });

      await expect(task.checkNpmVersion()).to.be.rejectedWith(TypeError, /Invalid Version/);
      expect(ui.output).to.be.empty;
      expect(ui.errors).to.be.empty;
    });

    it('rejects when an unknown error is thrown', async function () {
      td.when(task.npm(['--version'])).thenReject(new Error('foobar?'));

      await expect(task.checkNpmVersion()).to.be.rejectedWith('foobar?');
      expect(ui.output).to.be.empty;
      expect(ui.errors).to.be.empty;
    });
  });

  describe('checkYarn', function () {
    let task, ui;

    beforeEach(function () {
      ui = new MockUI();
      task = new NpmTask({ ui });
      task.yarn = td.function();
    });

    it('resolves when yarn <2.0.0 is found', async function () {
      td.when(task.yarn(['--version'])).thenResolve({ stdout: '1.22.0' });

      await task.checkYarn();
      expect(ui.output).to.be.empty;
      expect(ui.errors).to.be.empty;
    });

    it('resolves with warning when yarn >=2.0.0 is found', async function () {
      td.when(task.yarn(['--version'])).thenResolve({ stdout: '2.0.0' });

      await task.checkYarn();
      expect(ui.output).to.contain('WARNING');
      expect(ui.errors).to.be.empty;
    });

    it('rejects when yarn is not found', async function () {
      let error = new Error('yarn not found');
      error.code = 'ENOENT';

      td.when(task.yarn(['--version'])).thenReject(error);

      await expect(task.checkYarn()).to.be.rejectedWith(
        SilentError,
        /instructions at https:\/\/classic.yarnpkg.com\/en\/docs\/install/
      );
    });

    it('rejects when an unknown error is thrown', async function () {
      td.when(task.yarn(['--version'])).thenReject(new Error('foobar?'));

      await expect(task.checkYarn()).to.be.rejectedWith('foobar?');
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

    it('resolves when no yarn.lock file was found and npm is compatible', async function () {
      td.when(task.hasYarnLock()).thenReturn(false);
      td.when(task.checkNpmVersion()).thenResolve();

      await task.findPackageManager();
    });

    it('resolves when no yarn.lock file was found and npm is incompatible', async function () {
      td.when(task.hasYarnLock()).thenReturn(false);
      td.when(task.checkNpmVersion()).thenReject();

      await expect(task.findPackageManager()).to.be.rejected;
    });

    it('resolves when yarn.lock file and yarn were found', async function () {
      td.when(task.hasYarnLock()).thenReturn(true);
      td.when(task.checkYarn()).thenResolve({ name: 'yarn', version: '1.22.0' });

      expect(task.useYarn).to.be.undefined;
      let packageManager = await task.findPackageManager();
      expect(packageManager).to.have.property('name', 'yarn');
      expect(packageManager).to.have.property('version', '1.22.0');
    });

    it('resolves when yarn.lock file was found, yarn was not found and npm is compatible', async function () {
      td.when(task.hasYarnLock()).thenReturn(true);
      td.when(task.checkYarn()).thenReject();
      td.when(task.checkNpmVersion()).thenResolve();

      expect(task.useYarn).to.be.undefined;
      await task.findPackageManager();
      expect(task.useYarn).to.not.be.true;
    });

    it('rejects when yarn.lock file was found, yarn was not found and npm is incompatible', async function () {
      td.when(task.hasYarnLock()).thenReturn(true);
      td.when(task.checkYarn()).thenReject();
      td.when(task.checkNpmVersion()).thenReject();

      await expect(task.findPackageManager()).to.be.rejected;
    });

    it('resolves when yarn is requested and found', async function () {
      td.when(task.checkYarn()).thenResolve({ name: 'yarn', version: '1.22.0' });

      await task.findPackageManager({ useYarn: true });
    });

    it('rejects with SilentError when yarn is requested but not found', async function () {
      let error = new SilentError(
        'Ember CLI is now using yarn, but was not able to find it.\n' +
          'Please install yarn using the instructions at https://classic.yarnpkg.com/en/docs/install'
      );

      td.when(task.checkYarn()).thenReject(error);

      await expect(task.findPackageManager({ useYarn: true })).to.be.rejectedWith(
        SilentError,
        /instructions at https:\/\/classic.yarnpkg.com\/en\/docs\/install/
      );
    });

    it('rejects when yarn is requested and yarn check errors', async function () {
      td.when(task.checkYarn()).thenReject(new Error('foobar'));

      await expect(task.findPackageManager({ useYarn: true })).to.be.rejectedWith('foobar');
    });

    it('resolves when npm is requested and compatible', async function () {
      td.when(task.checkNpmVersion()).thenResolve();

      await task.findPackageManager({ useYarn: false });
    });

    it('rejects when npm is requested but incompatible', async function () {
      td.when(task.checkNpmVersion()).thenReject();

      await expect(task.findPackageManager({ useYarn: false })).to.be.rejected;
    });
  });

  describe('toYarnArgs', function () {
    let task;

    beforeEach(function () {
      task = new NpmTask();
      task.packageManager = { name: 'yarn', version: '1.22.0' };
    });

    it('correctly adds "--non-interactive" for yarn versions <2.0.0', function () {
      let args = task.toYarnArgs('install', {});
      expect(args).to.deep.equal(['install', '--non-interactive']);
    });

    it('skips "--non-interactive" for yarn versions >=2.0.0', function () {
      task.packageManager.version = '2.0.1';
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

  describe('toPNPMArgs', function () {
    let task;

    beforeEach(function () {
      task = new NpmTask();
    });

    it('converts "npm install --save foobar" to "pnpm add foobar"', function () {
      let args = task.toPNPMArgs('install', { save: true, packages: ['foobar'] });

      expect(args).to.deep.equal(['add', 'foobar']);
    });

    it('converts "npm install --save-dev --save-exact foo" to "pnpm add --save-dev --save-exact foo"', function () {
      let args = task.toPNPMArgs('install', {
        'save-dev': true,
        'save-exact': true,
        packages: ['foo'],
      });

      expect(args).to.deep.equal(['add', '--save-dev', '--save-exact', 'foo']);
    });

    it('converts "npm uninstall bar" to "pnpm remove bar"', function () {
      let args = task.toPNPMArgs('uninstall', { packages: ['bar'] });

      expect(args).to.deep.equal(['remove', 'bar']);
    });

    it('throws when "pnpm install" is called with packages', function () {
      expect(() => task.toPNPMArgs('install', { packages: ['foo'] })).to.throw(Error, /install foo/);
    });
  });
});
