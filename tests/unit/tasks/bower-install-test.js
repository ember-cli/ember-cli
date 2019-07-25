'use strict';

const BowerInstallTask = require('../../../lib/tasks/bower-install');
const MockUI = require('console-ui/mock');
const expect = require('../../chai').expect;
const td = require('testdouble');

describe('BowerInstallTask', function() {
  let task, ui;

  beforeEach(function() {
    ui = new MockUI();
    task = new BowerInstallTask({ ui });
  });

  describe('ensureBower()', function() {
    beforeEach(function() {
      task.resolveBower = td.function();
      task.importBower = td.function();
      task.installBower = td.function();
    });

    it('resolves if "bower" property is set', async function() {
      let mockValue = 'foobar';
      task.bower = mockValue;

      td.when(task.resolveBower()).thenReject(new Error());

      await task.ensureBower();
      expect(task.bower).to.equal(mockValue);
    });

    it('imports "bower" if it can be resolved', async function() {
      td.when(task.resolveBower()).thenResolve('path/to/bower');
      td.when(task.importBower('path/to/bower')).thenReturn('ok');

      expect(await task.ensureBower()).to.equal('ok');
    });

    it('install "bower" if it can not be resolved', async function() {
      let error = new Error("Cannot find module 'bower'");

      td.when(task.resolveBower()).thenReturn(Promise.reject(error), Promise.resolve('path/to/bower'));
      td.when(task.installBower()).thenResolve();
      td.when(task.importBower('path/to/bower')).thenReturn('ok');

      expect(await task.ensureBower()).to.equal('ok');
    });

    it('pass other resolve errors on', async function() {
      let error = new Error('foobar');

      td.when(task.resolveBower()).thenReturn(Promise.reject(error));

      await expect(task.ensureBower()).to.be.rejectedWith('foobar');
    });

    it('pass install errors on', async function() {
      let error = new Error("Cannot find module 'bower'");

      td.when(task.resolveBower()).thenReturn(Promise.reject(error));
      td.when(task.installBower()).thenReject(new Error('foobar'));

      await expect(task.ensureBower()).to.be.rejectedWith('foobar');
    });
  });
});
