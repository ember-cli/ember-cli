'use strict';

var expect         = require('chai').expect;
var stub           = require('../../helpers/stub').stub;
var commandOptions = require('../../factories/command-options');
var DoctorCommand  = require('../../../lib/commands/doctor');
var Task           = require('../../../lib/models/task');

describe('doctor command', function() {
  var command, options, tasks, doctorInstance;

  beforeEach(function() {
    tasks = {
      Doctor: Task.extend({
        init: function() {
          doctorInstance = this;
        }
      })
    };

    options = commandOptions({
      settings: {},

      project: {
        name: function() {
          return 'some-random-name';
        },

        isEmberCLIProject: function() {
          return true;
        }
      },

      tasks: tasks
    });

    stub(tasks.Doctor.prototype, 'run');
    command = new DoctorCommand(options);
  });

  afterEach(function() {
    tasks.Doctor.prototype.run.restore();
  });

  it('initializes doctor task with ui, project and analytics', function() {
    return command.validateAndRun([]).then(function() {
      expect(doctorInstance.ui, 'ui was set');
      expect(doctorInstance.project, 'project was set');
      expect(doctorInstance.analytics, 'analytics was set');
    });
  });

  it('with no args', function() {
    return command.validateAndRun([]).then(function() {
      var doctorRun = tasks.Doctor.prototype.run;
      expect(doctorRun.called, 1, 'expected doctor task to be called once');
      expect(doctorRun.calledWith[0][0]).to.deep.equal({});
    });
  });

  it('with skipped args comma deliminated', function() {
    return command.validateAndRun(['--skip=npm,foo']).then(function() {
      var doctorRun = tasks.Doctor.prototype.run;
      expect(doctorRun.called, 1, 'expected doctor task to be called once');
      expect(doctorRun.calledWith[0][0]).to.deep.equal({skip: ['npm', 'foo']});
    });
  });

  it('with skipped args space deliminated', function() {
    return command.validateAndRun(['--skip=npm foo']).then(function() {
      var doctorRun = tasks.Doctor.prototype.run;
      expect(doctorRun.called, 1, 'expected doctor task to be called once');
      expect(doctorRun.calledWith[0][0]).to.deep.equal({skip: ['npm', 'foo']});
    });
  });

  it('with skipped args extraneous', function() {
    return command.validateAndRun(['--skip=npm,    foo, bar']).then(function() {
      var doctorRun = tasks.Doctor.prototype.run;
      expect(doctorRun.called, 1, 'expected doctor task to be called once');
      expect(doctorRun.calledWith[0][0]).to.deep.equal({skip: ['npm', 'foo', 'bar']});
    });
  });
});