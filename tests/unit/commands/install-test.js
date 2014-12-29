'use strict';

var expect         = require('chai').expect;
var stub           = require('../../helpers/stub').stub;
var commandOptions = require('../../factories/command-options');
var InstallCommand = require('../../../lib/commands/install');
var Task           = require('../../../lib/models/task');
var Promise        = require('../../../lib/ext/promise');

describe('install command', function() {
  var command, options, tasks, bowerInstance, npmInstance;

  beforeEach(function() {
    tasks = {
      BowerInstall: Task.extend({
        init: function() {
          bowerInstance = this;
        }
      }),

      NpmInstall: Task.extend({
        init: function() {
          npmInstance = this;
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

    stub(tasks.BowerInstall.prototype, 'run', Promise.resolve());
    stub(tasks.NpmInstall.prototype, 'run', Promise.resolve());

    command = new InstallCommand(options);
  });

  afterEach(function() {
    tasks.BowerInstall.prototype.run.restore();
    tasks.NpmInstall.prototype.run.restore();
  });

  it('runs the bower install task and npm install task', function() {
    return command.validateAndRun([]).then(function() {
      var bowerRun = tasks.BowerInstall.prototype.run;
      expect(bowerRun.called).to.equal(1, 'expected bower install run was called once');
      expect(bowerRun.calledWith[0][0]).to.deep.equal({}, 'expected bower install called with empty options');

      var npmRun = tasks.NpmInstall.prototype.run;
      expect(npmRun.called).to.equal(1, 'expected npm install run was called once');
      expect(npmRun.calledWith[0][0]).to.deep.equal({}, 'expected npm install called with empty options');
    });
  });

  it('initializes npm task with ui, project and analytics', function() {
    return command.validateAndRun([]).then(function() {
      expect(npmInstance.ui, 'ui was set');
      expect(npmInstance.project, 'project was set');
      expect(npmInstance.analytics, 'analytics was set');
    });
  });

  it('initializes bower task with ui, project and analytics', function() {
    return command.validateAndRun([]).then(function() {
      expect(bowerInstance.ui, 'ui was set');
      expect(bowerInstance.project, 'project was set');
      expect(bowerInstance.analytics, 'analytics was set');
    });
  });

  it('warns when passing args', function() {
    return command.validateAndRun(['moment']).then(function() {
      expect(false, 'should have rejected with a warning');
    })
    .catch(function(error) {
      expect(error.message).to.equal('The `install` command does not take any arguments. You must use `install:npm` or `install:bower` to install a specific package.');
    });
  });
});
