'use strict';

const expect = require('chai').expect;
const MockProject = require('../../helpers/mock-project');
const commandOptions = require('../../factories/command-options');
const Promise = require('../../../lib/ext/promise');
const Task = require('../../../lib/models/task');
const AddonInstall = require('../../../lib/tasks/addon-install');
const InstallAddonCommand = require('../../../lib/commands/install-addon');

describe('install:addon command', function() {
  let npmInstance, generateBlueprintInstance;
  let command;

  beforeEach(function() {
    let tasks = {
      AddonInstall,
      NpmInstall: Task.extend({
        init() {
          this._super.apply(this, arguments);
          npmInstance = this;
        },
        run() {
          return Promise.resolve();
        },
      }),

      GenerateFromBlueprint: Task.extend({
        init() {
          this._super.apply(this, arguments);
          generateBlueprintInstance = this;
        },
        run() {
          return Promise.resolve();
        },
      }),
    };

    let project = new MockProject();

    project.isEmberCLIProject = function() { return true; };
    project.initializeAddons = function() { };
    project.reloadAddons = function() {
      this.addons = [{
        pkg: {
          name: 'ember-cli-photoswipe',
          'ember-addon': {
            defaultBlueprint: 'photoswipe',
          },
        },
      }];
    };

    let options = commandOptions({
      project,
      tasks,
    });

    command = new InstallAddonCommand(options);
  });

  it('will show a deprecation warning', function() {
    return command.validateAndRun(['ember-cli-photoswipe']).then(function() {
      expect(command.ui.output).to.include(
          'This command has been deprecated. Please use `ember install ' +
          '<addonName>` instead.');

      expect(npmInstance.ui, 'ui was set').to.be.ok;
      expect(npmInstance.project, 'project was set').to.be.ok;
      expect(npmInstance.analytics, 'analytics was set').to.be.ok;

      expect(generateBlueprintInstance.ui, 'ui was set').to.be.ok;
      expect(generateBlueprintInstance.project, 'project was set').to.be.ok;
      expect(generateBlueprintInstance.analytics, 'analytics was set').to.be.ok;
    });
  });
});
