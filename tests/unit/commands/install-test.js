'use strict';

var assert         = require('../../helpers/assert');
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
      assert.equal(bowerRun.called, 1, 'expected bower install run was called once');
      assert.deepEqual(bowerRun.calledWith[0][0], {}, 'expected bower install called with empty options');

      var npmRun = tasks.NpmInstall.prototype.run;
      assert.equal(npmRun.called, 1, 'expected npm install run was called once');
      assert.deepEqual(npmRun.calledWith[0][0], {}, 'expected npm install called with empty options');
    });
  });

  it('initializes npm task with ui, project and analytics', function() {
    return command.validateAndRun([]).then(function() {
      assert.ok(npmInstance.ui, 'ui was set');
      assert.ok(npmInstance.project, 'project was set');
      assert.ok(npmInstance.analytics, 'analytics was set');
    });
  });

  it('initializes bower task with ui, project and analytics', function() {
    return command.validateAndRun([]).then(function() {
      assert.ok(bowerInstance.ui, 'ui was set');
      assert.ok(bowerInstance.project, 'project was set');
      assert.ok(bowerInstance.analytics, 'analytics was set');
    });
  });

  it('warns when passing args', function() {
    return command.validateAndRun(['moment']).then(function() {
      assert.ok(false, 'should have rejected with a warning');
    })
    .catch(function(error) {
      assert.equal(error.message, 'The `install` command does not take any arguments. You must use `install:npm` or `install:bower` to install a specific package.');
    });
  });
});
