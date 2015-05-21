'use strict';

var expect = require('chai').expect;
var InstallAddonCommand = require('../../../lib/commands/install-addon');
var commandOptions = require('../../factories/command-options');
var AddonInstall = require('../../../lib/tasks/addon-install');
var Task = require('../../../lib/models/task');
var Promise = require('../../../lib/ext/promise');
var stub = require('../../helpers/stub').stub;
var Project = require('../../../lib/models/project');

describe('install:addon command', function() {
  var command, options, tasks, npmInstance, generateBlueprintInstance;

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
        initializeAddons: function() {  },
        reloadAddons: function() {
          this.addons = [{
            pkg: {
              name: 'ember-cli-photoswipe',
              'ember-addon': {
                defaultBlueprint: 'photoswipe'
              }
            }
          }];
        },

        findAddonByName: Project.prototype.findAddonByName
      },

      tasks: tasks
    });

    stub(tasks.NpmInstall.prototype, 'run', Promise.resolve());
    stub(tasks.GenerateFromBlueprint.prototype, 'run', Promise.resolve());

    command = new InstallAddonCommand(options);

  });

  afterEach(function() {
    tasks.NpmInstall.prototype.run.restore();
    tasks.GenerateFromBlueprint.prototype.run.restore();
  });


  it('will show a deprecation warning', function() {
    return command.validateAndRun(['ember-cli-photoswipe']).then(function() {
      var msg  = 'This command has been deprecated. Please use `ember install ';
      msg     += '<addonName>` instead.';

      expect(command.ui.output).to.include(msg);

      expect(npmInstance.ui, 'ui was set');
      expect(npmInstance.project, 'project was set');
      expect(npmInstance.analytics, 'analytics was set');

      expect(generateBlueprintInstance.ui, 'ui was set');
      expect(generateBlueprintInstance.project, 'project was set');
      expect(generateBlueprintInstance.analytics, 'analytics was set');

    });
  });
});
