'use strict';

var expect         = require('chai').expect;
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
      expect(bowerInstance.ui, 'ui was set');
      expect(bowerInstance.project, 'project was set');
      expect(bowerInstance.analytics, 'analytics was set');
    });
  });

  describe('with no args', function() {
    it('runs the bower install task with no packages and save true', function() {
      return command.validateAndRun([]).then(function() {
        var bowerRun = tasks.BowerInstall.prototype.run;
        expect(bowerRun.called).to.equal(1, 'expected bower install run was called once');
        expect(bowerRun.calledWith[0][0]).to.deep.equal({
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
        expect(bowerRun.called).to.equal(1, 'expected bower install run was called once');
        expect(bowerRun.calledWith[0][0]).to.deep.equal({
          packages: ['moment', 'lodash'],
          installOptions: { save: true }
        }, 'expected bower install called with given packages and save true');
      });
    });
  });
});
