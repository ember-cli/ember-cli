'use strict';

var expect           = require('chai').expect;
var stub             = require('../../helpers/stub').stub;
var commandOptions   = require('../../factories/command-options');
var UninstallCommand = require('../../../lib/commands/uninstall-npm');
var Task             = require('../../../lib/models/task');

describe('uninstall:npm command', function() {
  var command, options, tasks, npmInstance;

  beforeEach(function() {
    tasks = {
      NpmUninstall: Task.extend({
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

    stub(tasks.NpmUninstall.prototype, 'run');

    command = new UninstallCommand(options);
  });

  afterEach(function() {
    tasks.NpmUninstall.prototype.run.restore();
  });

  it('initializes npm task with ui, project and analytics', function() {
    return command.validateAndRun([]).then(function() {
      expect(npmInstance.ui, 'ui was set');
      expect(npmInstance.project, 'project was set');
      expect(npmInstance.analytics, 'analytics was set');
    });
  });

  describe('with no args', function() {
    it('runs the npm uninstall task with no packages, save-dev true and save-exact true', function() {
      return command.validateAndRun([]).then(function() {
        var npmRun = tasks.NpmUninstall.prototype.run;
        expect(npmRun.called).to.equal(1, 'expected npm uninstall run was called once');
        expect(npmRun.calledWith[0][0]).to.deep.equal({
          packages: [],
          'save-dev': true,
          'save-exact': true
        }, 'expected npm uninstall called with no packages, save-dev true, and save-exact true');
      });
    });
  });

  describe('with args', function() {
    it('runs the npm uninstall task with given packages', function() {
      return command.validateAndRun(['moment', 'lodash']).then(function() {
        var npmRun = tasks.NpmUninstall.prototype.run;
        expect(npmRun.called).to.equal(1, 'expected npm uninstall run was called once');
        expect(npmRun.calledWith[0][0]).to.deep.equal({
          packages: ['moment', 'lodash'],
          'save-dev': true,
          'save-exact': true
        }, 'expected npm uninstall called with given packages, save-dev true, and save-exact true');
      });
    });
  });
});
