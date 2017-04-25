'use strict';

const BowerInstallTask = require('../../../lib/tasks/bower-install');
const MockUI = require('console-ui/mock');
const Promise = require('rsvp').Promise;
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

    it('resolves if "bower" property is set', function() {
      let mockValue = 'foobar';
      task.bower = mockValue;

      td.when(task.resolveBower()).thenReject(new Error());

      return task.ensureBower().then(() => {
        expect(task.bower).to.equal(mockValue);
      });
    });

    it('imports "bower" if it can be resolved', function() {
      td.when(task.resolveBower()).thenResolve('path/to/bower');
      td.when(task.importBower('path/to/bower')).thenReturn('ok');

      return task.ensureBower().then(ok => {
        expect(ok).to.equal('ok');
      });
    });

    it('install "bower" if it can not be resolved', function() {
      let error = new Error('Cannot find module \'bower\'');

      td.when(task.resolveBower()).thenReturn(Promise.reject(error), Promise.resolve('path/to/bower'));
      td.when(task.installBower()).thenResolve();
      td.when(task.importBower('path/to/bower')).thenReturn('ok');

      return task.ensureBower().then(ok => {
        expect(ok).to.equal('ok');
      });
    });

    it('pass other resolve errors on', function() {
      let error = new Error('foobar');

      td.when(task.resolveBower()).thenReturn(Promise.reject(error));

      return expect(task.ensureBower()).to.be.rejectedWith('foobar');
    });

    it('pass install errors on', function() {
      let error = new Error('Cannot find module \'bower\'');

      td.when(task.resolveBower()).thenReturn(Promise.reject(error));
      td.when(task.installBower()).thenReject(new Error('foobar'));

      return expect(task.ensureBower()).to.be.rejectedWith('foobar');
    });
  });
});
