'use strict';

var assert         = require('../../helpers/assert');
var stub           = require('../../helpers/stub').stub;
var commandOptions = require('../../factories/command-options');
var InstallCommand = require('../../../lib/commands/install-addon');
var Task           = require('../../../lib/models/task');
var Project        = require('../../../lib/models/project');
var Promise        = require('../../../lib/ext/promise');

describe('install:addon command', function() {
  var command, options, tasks, generateBlueprintInstance, npmInstance;

  beforeEach(function() {
    tasks = {
      NpmInstall: Task.extend({
        init: function() {
          npmInstance = this;
        }
      }),

      GenerateFromBlueprint: Task.extend({
        init: function() {
          generateBlueprintInstance = this;
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
        },

        initializeAddons: function() { },
        reloadAddons: function() {
          this.addons = [
            {
              pkg: {
                name: 'ember-data',
              }
            },
            {
              pkg: {
                name: 'ember-cli-cordova',
                'ember-addon': {
                  defaultBlueprint: 'cordova-starter-kit'
                }
              }
            },
            {
              pkg: {
                name: 'ember-cli-qunit'
              }
            }
          ];
        },

        findAddonByName: Project.prototype.findAddonByName
      },

      tasks: tasks
    });

    stub(tasks.NpmInstall.prototype, 'run', Promise.resolve());
    stub(tasks.GenerateFromBlueprint.prototype, 'run', Promise.resolve());

    command = new InstallCommand(options);
  });

  afterEach(function() {
    tasks.NpmInstall.prototype.run.restore();
    tasks.GenerateFromBlueprint.prototype.run.restore();
  });

  it('initializes npm install and generate blueprint task with ui, project and analytics', function() {
    return command.validateAndRun(['ember-data']).then(function() {
      assert.ok(npmInstance.ui, 'ui was set');
      assert.ok(npmInstance.project, 'project was set');
      assert.ok(npmInstance.analytics, 'analytics was set');

      assert.ok(generateBlueprintInstance.ui, 'ui was set');
      assert.ok(generateBlueprintInstance.project, 'project was set');
      assert.ok(generateBlueprintInstance.analytics, 'analytics was set');
    });
  });

  describe('with args', function() {
    it('runs the npm install task with given name and save-dev true', function() {
      return command.validateAndRun(['ember-data']).then(function() {
        var npmRun = tasks.NpmInstall.prototype.run;
        assert.equal(npmRun.called, 1, 'expected npm install run was called once');

        assert.deepEqual(npmRun.calledWith[0][0], {
          packages: ['ember-data'],
          'save-dev': true
        }, 'expected npm install called with given name and save-dev true');
      });
    });

    it('runs the packae name blueprint task with given name and args', function() {
      return command.validateAndRun(['ember-data']).then(function() {
        var generateRun = tasks.GenerateFromBlueprint.prototype.run;
        assert.equal(generateRun.calledWith[0][0].ignoreMissingMain, true);
        assert.deepEqual(generateRun.calledWith[0][0].args, [
          'ember-data'
        ], 'expected generate blueprint called with correct args');
      });
    });

    it('runs the defaultBlueprint task with given github/name and args', function() {
      return command.validateAndRun(['ember-cli-cordova', 'com.ember.test']).then(function() {
        var generateRun = tasks.GenerateFromBlueprint.prototype.run;
        assert.equal(generateRun.calledWith[0][0].ignoreMissingMain, true);
        assert.deepEqual(generateRun.calledWith[0][0].args, [
          'cordova-starter-kit', 'com.ember.test'
        ], 'expected generate blueprint called with correct args');
      });
    });

    it('runs the package name blueprint task when given github/name and args', function() {
      return command.validateAndRun(['ember-cli/ember-cli-qunit']).then(function() {
        var generateRun = tasks.GenerateFromBlueprint.prototype.run;
        assert.equal(generateRun.calledWith[0][0].ignoreMissingMain, true);
        assert.deepEqual(generateRun.calledWith[0][0].args, [
          'ember-cli-qunit'
        ], 'expected generate blueprint called with correct args');
      });
    });

    it('gives helpful message if it can\'t find the addon', function() {
      return command.validateAndRun(['unknown-addon']).then(function() {
        assert.ok(false, 'should reject with error');
      }).catch(function(err) {
        assert.equal(err.message, [
          'Install failed. Could not find addon with name: unknown-addon'
        ], 'expected error to have helpful message');
      });
    });
  });
});
