'use strict';

const expect = require('../../chai').expect;
const MockProject = require('../../helpers/mock-project');
const commandOptions = require('../../factories/command-options');
const Task = require('../../../lib/models/task');
const Promise = require('rsvp').Promise;
const AddonInstall = require('../../../lib/tasks/addon-install');
const InstallCommand = require('../../../lib/commands/install');
const td = require('testdouble');

describe('install command', function() {
  let generateBlueprintInstance, npmInstance;
  let command, tasks;

  beforeEach(function() {
    let project = new MockProject();

    project.isEmberCLIProject = function() {
      return true;
    };

    project.initializeAddons = function() {};
    project.reloadAddons = function() {
      this.addons = [
        {
          pkg: {
            name: 'ember-data',
          },
        },
        {
          pkg: {
            name: 'ember-cli-cordova',
            'ember-addon': {
              defaultBlueprint: 'cordova-starter-kit',
            },
          },
        },
        {
          pkg: {
            name: 'ember-cli-qunit',
          },
        },
        {
          pkg: {
            name: '@ember-cli/ember-cli-qunit',
          },
        },
      ];
    };

    tasks = {
      AddonInstall,
      NpmInstall: Task.extend({
        project,
        init() {
          this._super.apply(this, arguments);
          npmInstance = this;
        },
      }),

      GenerateFromBlueprint: Task.extend({
        project,
        init() {
          this._super.apply(this, arguments);
          generateBlueprintInstance = this;
        },
      }),
    };

    let options = commandOptions({
      project,
      tasks,
    });

    td.replace(tasks.NpmInstall.prototype, 'run', td.function());
    td.when(tasks.NpmInstall.prototype.run(), { ignoreExtraArgs: true }).thenReturn(Promise.resolve());
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
        let npmRun = tasks.NpmInstall.prototype.run;

        td.verify(
          npmRun({
            packages: ['ember-data'],
            save: false,
            'save-dev': true,
            'save-exact': false,
            useYarn: undefined,
          }),
          { times: 1 }
        );
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
        let npmRun = tasks.NpmInstall.prototype.run;

        td.verify(
          npmRun({
            packages: ['ember-data'],
            save: false,
            'save-dev': true,
            'save-exact': false,
            useYarn: undefined,
          }),
          { times: 1 }
        );
      });
    });

    it('runs the npm install task with given name and save true with the --save option', function() {
      return command.validateAndRun(['ember-data', '--save']).then(function() {
        let npmRun = tasks.NpmInstall.prototype.run;

        td.verify(
          npmRun({
            packages: ['ember-data'],
            save: true,
            'save-dev': false,
            'save-exact': false,
            useYarn: undefined,
          }),
          { times: 1 }
        );
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
        let npmRun = tasks.NpmInstall.prototype.run;

        td.verify(
          npmRun({
            packages: ['ember-data'],
            save: true,
            'save-dev': false,
            'save-exact': false,
            useYarn: undefined,
          }),
          { times: 1 }
        );
      });
    });

    it('runs the package name blueprint task with given name and args', function() {
      return command.validateAndRun(['ember-data']).then(function() {
        let generateRun = tasks.GenerateFromBlueprint.prototype.run;
        let captor = td.matchers.captor();
        td.verify(generateRun(captor.capture()));
        expect(captor.value.ignoreMissingMain).to.be.true;
        expect(captor.value.args).to.deep.equal(['ember-data'], 'expected generate blueprint called with correct args');
      });
    });

    it('fails to install second argument for unknown addon', function() {
      return expect(command.validateAndRun(['ember-cli-cordova', 'com.ember.test'])).to.be.rejected.then(error => {
        let generateRun = tasks.GenerateFromBlueprint.prototype.run;
        let captor = td.matchers.captor();
        td.verify(generateRun(captor.capture()));
        expect(captor.value.ignoreMissingMain).to.be.true;
        expect(captor.value.args).to.deep.equal(
          ['cordova-starter-kit'],
          'expected generate blueprint called with correct args'
        );
        expect(error.message).to.equal(
          'Install failed. Could not find addon with name: com.ember.test',
          'expected error to have helpful message'
        );
      });
    });

    it('runs npmInstall once and installs three addons', function() {
      return command.validateAndRun(['ember-data', 'ember-cli-cordova', 'ember-cli-qunit']).then(function() {
        let npmRun = tasks.NpmInstall.prototype.run;

        td.verify(
          npmRun({
            packages: ['ember-data', 'ember-cli-cordova', 'ember-cli-qunit'],
            save: false,
            'save-dev': true,
            'save-exact': false,
            useYarn: undefined,
          }),
          { times: 1 }
        );

        let generateRun = tasks.GenerateFromBlueprint.prototype.run;
        let generateRunArgs = td.explain(generateRun).calls.map(function(call) {
          return call.args[0].args[0];
        });
        expect(generateRunArgs).to.deep.equal(['ember-data', 'cordova-starter-kit', 'ember-cli-qunit']);
      });
    });

    it('ember-cli/ember-cli-qunit: runs npmInstall but does not install the addon blueprint', function() {
      return command.validateAndRun(['ember-cli/ember-cli-qunit']).then(function() {
        let npmRun = tasks.NpmInstall.prototype.run;

        td.verify(
          npmRun({
            packages: ['ember-cli/ember-cli-qunit'],
            save: false,
            'save-dev': true,
            'save-exact': false,
            useYarn: undefined,
          }),
          { times: 1 }
        );

        let generateRun = tasks.GenerateFromBlueprint.prototype.run;
        td.verify(generateRun(), { ignoreExtraArgs: true, times: 0 });
      });
    });

    it('ember-cli-qunit@1.2.0: runs npmInstall and installs the addon blueprint', function() {
      return command.validateAndRun(['ember-cli-qunit@1.2.0']).then(function() {
        let npmRun = tasks.NpmInstall.prototype.run;

        td.verify(
          npmRun({
            packages: ['ember-cli-qunit@1.2.0'],
            save: false,
            'save-dev': true,
            'save-exact': false,
            useYarn: undefined,
          }),
          { times: 1 }
        );

        let generateRun = tasks.GenerateFromBlueprint.prototype.run;
        let generateRunArgs = td.explain(generateRun).calls.map(function(call) {
          return call.args[0].args[0];
        });
        expect(generateRunArgs).to.deep.equal(['ember-cli-qunit']);
      });
    });

    it('@ember-cli/ember-cli-qunit: runs npmInstall and installs the addon blueprint', function() {
      return command.validateAndRun(['@ember-cli/ember-cli-qunit']).then(function() {
        let npmRun = tasks.NpmInstall.prototype.run;

        td.verify(
          npmRun({
            packages: ['@ember-cli/ember-cli-qunit'],
            save: false,
            'save-dev': true,
            'save-exact': false,
            useYarn: undefined,
          }),
          { times: 1 }
        );

        let generateRun = tasks.GenerateFromBlueprint.prototype.run;
        let generateRunArgs = td.explain(generateRun).calls.map(function(call) {
          return call.args[0].args[0];
        });
        expect(generateRunArgs).to.deep.equal(['@ember-cli/ember-cli-qunit']);
      });
    });

    it("gives helpful message if it can't find the addon", function() {
      return expect(command.validateAndRun(['unknown-addon'])).to.be.rejected.then(error => {
        expect(error.message).to.equal(
          'Install failed. Could not find addon with name: unknown-addon',
          'expected error to have helpful message'
        );
      });
    });
  });

  describe('without args', function() {
    it('gives a helpful message if no arguments are passed', function() {
      return expect(command.validateAndRun([])).to.be.rejected.then(error => {
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
