'use strict';

var expect         = require('chai').expect;
var stub           = require('../../helpers/stub').stub;
var commandOptions = require('../../factories/command-options');
var InstallCommand = require('../../../lib/commands/install');
var Task           = require('../../../lib/models/task');
var Project        = require('../../../lib/models/project');
var Promise        = require('../../../lib/ext/promise');
var AddonInstall   = require('../../../lib/tasks/addon-install');

describe('install command', function() {
  var command, options, tasks, generateBlueprintInstance, npmInstance;

  beforeEach(function() {
    tasks = {
      AddonInstall: AddonInstall,
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
      expect(npmInstance.ui, 'ui was set');
      expect(npmInstance.project, 'project was set');
      expect(npmInstance.analytics, 'analytics was set');

      expect(generateBlueprintInstance.ui, 'ui was set');
      expect(generateBlueprintInstance.project, 'project was set');
      expect(generateBlueprintInstance.analytics, 'analytics was set');
    });
  });

  describe('with args', function() {
    it('runs the npm install task with given name and save-dev true', function() {
      return command.validateAndRun(['ember-data']).then(function() {
        var npmRun = tasks.NpmInstall.prototype.run;
        expect(npmRun.called).to.equal(1, 'expected npm install run was called once');

        expect(npmRun.calledWith[0][0]).to.deep.equal({
          packages: ['ember-data'],
          'save-dev': true,
          'save-exact': true
        }, 'expected npm install called with given name and save-dev true');
      });
    });

    it('runs the packae name blueprint task with given name and args', function() {
      return command.validateAndRun(['ember-data']).then(function() {
        var generateRun = tasks.GenerateFromBlueprint.prototype.run;
        expect(generateRun.calledWith[0][0].ignoreMissingMain, true);
        expect(generateRun.calledWith[0][0].args).to.deep.equal([
          'ember-data'
        ], 'expected generate blueprint called with correct args');
      });
    });

    it('runs the defaultBlueprint task with given github/name and args', function() {
      return command.validateAndRun(['ember-cli-cordova', 'com.ember.test']).then(function() {
        var generateRun = tasks.GenerateFromBlueprint.prototype.run;
        expect(generateRun.calledWith[0][0].ignoreMissingMain, true);
        expect(generateRun.calledWith[0][0].args).to.deep.equal([
          'cordova-starter-kit', 'com.ember.test'
        ], 'expected generate blueprint called with correct args');
      });
    });

    it('runs the package name blueprint task when given github/name and args', function() {
      return command.validateAndRun(['ember-cli/ember-cli-qunit']).then(function() {
        var generateRun = tasks.GenerateFromBlueprint.prototype.run;
        expect(generateRun.calledWith[0][0].ignoreMissingMain, true);
        expect(generateRun.calledWith[0][0].args).to.deep.equal([
          'ember-cli-qunit'
        ], 'expected generate blueprint called with correct args');
      });
    });

    it('gives helpful message if it can\'t find the addon', function() {
      return command.validateAndRun(['unknown-addon']).then(function() {
        expect(false, 'should reject with error');
      }).catch(function(err) {
        expect(err.message).to.equal(
          'Install failed. Could not find addon with name: unknown-addon',
          'expected error to have helpful message'
        );
      });
    });
  });

  describe('without args', function() {
    it('gives a helpful message if no arguments are passed', function() {
      return command.validateAndRun([]).then(function() {
        expect(false, 'should reject with error');
      }).catch(function(err) {
        var msg = 'The `install` command must take an argument with the name ';
        msg    += 'of an ember-cli addon. For installing all npm and bower ';
        msg    += 'dependencies you can run `npm install && bower install`.';
        expect(err.message).to.equal(
          msg, 'expect error to have a helpful message'
        );
      });
    });
  });
});
