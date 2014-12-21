'use strict';

var assert         = require('../../helpers/assert');
var stub           = require('../../helpers/stub').stub;
var commandOptions = require('../../factories/command-options');
var InstallCommand = require('../../../lib/commands/install-bower');
var Task           = require('../../../lib/models/task');

describe('install:bower command', function() {
  var command, options, tasks, bowerInstance;

  beforeEach(function() {
    tasks = {
      BowerInstall: Task.extend({
        init: function() {
          bowerInstance = this;
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

    stub(tasks.BowerInstall.prototype, 'run');

    command = new InstallCommand(options);
  });

  afterEach(function() {
    tasks.BowerInstall.prototype.run.restore();
  });

  it('initializes bower task with ui, project and analytics', function() {
    return command.validateAndRun([]).then(function() {
      assert.ok(bowerInstance.ui, 'ui was set');
      assert.ok(bowerInstance.project, 'project was set');
      assert.ok(bowerInstance.analytics, 'analytics was set');
    });
  });

  describe('with no args', function() {
    it('runs the bower install task with no packages and save true', function() {
      return command.validateAndRun([]).then(function() {
        var bowerRun = tasks.BowerInstall.prototype.run;
        assert.equal(bowerRun.called, 1, 'expected bower install run was called once');
        assert.deepEqual(bowerRun.calledWith[0][0], {
          packages: [],
          installOptions: { save: true }
        }, 'expected bower install called with no packages and save true');
      });
    });
  });

  describe('with args', function() {
    it('runs the bower install task with given packages and save true', function() {
      return command.validateAndRun(['moment', 'lodash']).then(function() {
        var bowerRun = tasks.BowerInstall.prototype.run;
        assert.equal(bowerRun.called, 1, 'expected bower install run was called once');
        assert.deepEqual(bowerRun.calledWith[0][0], {
          packages: ['moment', 'lodash'],
          installOptions: { save: true }
        }, 'expected bower install called with given packages and save true');
      });
    });
  });
});
