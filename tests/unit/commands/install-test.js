'use strict';

var expect         = require('chai').expect;
var MockProject    = require('../../helpers/mock-project');
var commandOptions = require('../../factories/command-options');
var Task           = require('../../../lib/models/task');
var Promise        = require('../../../lib/ext/promise');
var AddonInstall   = require('../../../lib/tasks/addon-install');
var InstallCommand = require('../../../lib/commands/install');
var td = require('testdouble');

describe('install command', function() {
  var generateBlueprintInstance, npmInstance;
  var command, tasks;

  beforeEach(function() {
    var project = new MockProject();

    project.isEmberCLIProject = function() {
      return true;
    };

    project.initializeAddons = function() {};
    project.reloadAddons = function() {
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
    };

    tasks = {
      AddonInstall: AddonInstall,
      NpmInstall: Task.extend({
        project: project,
        init: function() {
          this._super.apply(this, arguments);
          npmInstance = this;
        }
      }),

      GenerateFromBlueprint: Task.extend({
        project: project,
        init: function() {
          this._super.apply(this, arguments);
          generateBlueprintInstance = this;
        }
      })
    };

    var options = commandOptions({
      project: project,
      tasks: tasks
    });

    td.replace(tasks.NpmInstall.prototype, 'run', td.function());
    td.when(tasks.NpmInstall.prototype.run(), {ignoreExtraArgs: true}).thenReturn(Promise.resolve());
    td.replace(tasks.GenerateFromBlueprint.prototype, 'run', td.function());

    command = new InstallCommand(options);
  });

  afterEach(function() {
    td.reset();
  });

  it('initializes npm install and generate blueprint task with ui, project and analytics', function() {
    return command.validateAndRun(['ember-data']).then(function() {
      expect(npmInstance.ui, 'ui was set').to.be.ok;
      expect(npmInstance.project, 'project was set').to.be.ok;
      expect(npmInstance.analytics, 'analytics was set').to.be.ok;

      expect(generateBlueprintInstance.ui, 'ui was set').to.be.ok;
      expect(generateBlueprintInstance.project, 'project was set').to.be.ok;
      expect(generateBlueprintInstance.analytics, 'analytics was set').to.be.ok;
    });
  });

  describe('with args', function() {
    it('runs the npm install task with given name and save-dev true', function() {
      return command.validateAndRun(['ember-data']).then(function() {
        var npmRun = tasks.NpmInstall.prototype.run;

        td.verify(npmRun({
          packages: ['ember-data'],
          'save': false,
          'save-dev': true,
          'save-exact': false
        }), {times: 1});
      });
    });

    it('runs the npm install task with given name and save-dev true in an addon', function() {
      command.project.isEmberCLIProject = function() {
        return false;
      };
      command.project.isEmberCLIAddon = function() {
        return true;
      };
      return command.validateAndRun(['ember-data']).then(function() {
        var npmRun = tasks.NpmInstall.prototype.run;

        td.verify(npmRun({
          packages: ['ember-data'],
          'save': false,
          'save-dev': true,
          'save-exact': false
        }), {times: 1});
      });
    });

    it('runs the npm install task with given name and save true with the --save option', function() {
      return command.validateAndRun(['ember-data', '--save']).then(function() {
        var npmRun = tasks.NpmInstall.prototype.run;

        td.verify(npmRun({
          packages: ['ember-data'],
          'save': true,
          'save-dev': false,
          'save-exact': false
        }), {times: 1});
      });
    });

    it('runs the npm install task with given name and save true in an addon with the --save option', function() {
      command.project.isEmberCLIProject = function() {
        return false;
      };
      command.project.isEmberCLIAddon = function() {
        return true;
      };
      return command.validateAndRun(['ember-data', '--save']).then(function() {
        var npmRun = tasks.NpmInstall.prototype.run;

        td.verify(npmRun({
          packages: ['ember-data'],
          'save': true,
          'save-dev': false,
          'save-exact': false
        }), {times: 1});
      });
    });

    it('runs the package name blueprint task with given name and args', function() {
      return command.validateAndRun(['ember-data']).then(function() {
        var generateRun = tasks.GenerateFromBlueprint.prototype.run;
        var captor = td.matchers.captor();
        td.verify(generateRun(captor.capture()));
        expect(captor.value.ignoreMissingMain).to.be.true;
        expect(captor.value.args).to.deep.equal([
          'ember-data'
        ], 'expected generate blueprint called with correct args');
      });
    });

    it('fails to install second argument for unknown addon', function() {
      return command.validateAndRun(['ember-cli-cordova', 'com.ember.test']).then(function() {
        expect(false, 'should reject with error').to.be.ok;
      }).catch(function(error) {
        var generateRun = tasks.GenerateFromBlueprint.prototype.run;
        var captor = td.matchers.captor();
        td.verify(generateRun(captor.capture()));
        expect(captor.value.ignoreMissingMain).to.be.true;
        expect(captor.value.args).to.deep.equal([
          'cordova-starter-kit'
        ], 'expected generate blueprint called with correct args');
        expect(error.message).to.equal(
          'Install failed. Could not find addon with name: com.ember.test',
          'expected error to have helpful message'
        );
      });
    });

    it('runs npmInstall once and installs three addons', function() {
      return command.validateAndRun([
        'ember-data', 'ember-cli-cordova', 'ember-cli-qunit'
      ]).then(function() {
        var npmRun = tasks.NpmInstall.prototype.run;

        td.verify(npmRun({
          packages: ['ember-data', 'ember-cli-cordova', 'ember-cli-qunit'],
          'save': false,
          'save-dev': true,
          'save-exact': false
        }), {times: 1});

        var generateRun = tasks.GenerateFromBlueprint.prototype.run;
        var generateRunArgs = td.explain(generateRun).calls.map(function(call) { return call.args[0].args[0]; });
        expect(generateRunArgs).to.deep.equal(['ember-data', 'cordova-starter-kit', 'ember-cli-qunit']);
      });
    });

    it('ember-cli/ember-cli-qunit: runs npmInstall but does not install the addon blueprint', function() {
      return command.validateAndRun(['ember-cli/ember-cli-qunit']).then(function() {
        var npmRun = tasks.NpmInstall.prototype.run;

        td.verify(npmRun({
          packages: ['ember-cli/ember-cli-qunit'],
          'save': false,
          'save-dev': true,
          'save-exact': false
        }), {times: 1});

        var generateRun = tasks.GenerateFromBlueprint.prototype.run;
        td.verify(generateRun(), {ignoreExtraArgs: true, times: 0});
      });
    });

    it('ember-cli-qunit@1.2.0: runs npmInstall and installs the addon blueprint', function() {
      return command.validateAndRun(['ember-cli-qunit@1.2.0']).then(function() {
        var npmRun = tasks.NpmInstall.prototype.run;

        td.verify(npmRun({
          packages: ['ember-cli-qunit@1.2.0'],
          'save': false,
          'save-dev': true,
          'save-exact': false
        }), {times: 1});

        var generateRun = tasks.GenerateFromBlueprint.prototype.run;
        var generateRunArgs = td.explain(generateRun).calls.map(function(call) { return call.args[0].args[0]; });
        expect(generateRunArgs).to.deep.equal(['ember-cli-qunit']);
      });
    });

    it('@ember-cli/ember-cli-qunit: runs npmInstall and installs the addon blueprint', function() {
      return command.validateAndRun(['@ember-cli/ember-cli-qunit']).then(function() {
        var npmRun = tasks.NpmInstall.prototype.run;

        td.verify(npmRun({
          packages: ['@ember-cli/ember-cli-qunit'],
          'save': false,
          'save-dev': true,
          'save-exact': false
        }), {times: 1});

        var generateRun = tasks.GenerateFromBlueprint.prototype.run;
        var generateRunArgs = td.explain(generateRun).calls.map(function(call) { return call.args[0].args[0]; });
        expect(generateRunArgs).to.deep.equal(['ember-cli-qunit']);
      });
    });

    it('gives helpful message if it can\'t find the addon', function() {
      return command.validateAndRun(['unknown-addon']).then(function() {
        expect(false, 'should reject with error').to.be.ok;
      }).catch(function(error) {
        expect(error.message).to.equal(
          'Install failed. Could not find addon with name: unknown-addon',
          'expected error to have helpful message'
        );
      });
    });
  });

  describe('without args', function() {
    it('gives a helpful message if no arguments are passed', function() {
      return command.validateAndRun([]).then(function() {
        expect(false, 'should reject with error').to.be.ok;
      }).catch(function(error) {
        expect(error.message).to.equal(
          'The `install` command must take an argument with the name ' +
          'of an ember-cli addon. For installing all npm and bower ' +
          'dependencies you can run `npm install && bower install`.',
          'expect error to have a helpful message'
        );
      });
    });
  });
});
