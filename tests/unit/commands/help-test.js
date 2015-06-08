'use strict';

var expect  = require('chai').expect;
var MockUI  = require('../../helpers/mock-ui');
var MockAnalytics  = require('../../helpers/mock-analytics');
var Command = require('../../../lib/models/command');
var Project       = require('../../../lib/models/project');
var AddonCommand  = require('../../fixtures/addon/commands/addon-command');

describe('help command', function() {
  var ui;
  var analytics;

  var commands = {
    'TestCommand1': Command.extend({
      name: 'test-command-1',
      description: 'command-description',
      aliases: ['t1', 'test-1'],
      availableOptions: [
        { name: 'option-with-default', type: String, default: 'default-value' },
        { name: 'required-option', type: String, required: 'true', description: 'option-descriptionnnn' }
      ],
      run: function() {}
    }),
    'TestCommand2': Command.extend({
      name: 'test-command-2',
      aliases: ['t2', 'test-2'],
      run: function() {}
    }),
    'TestCommand3': Command.extend({
      name: 'test-command-3',
      description: 'This is test command 3 description',
      skipHelp: true,
      aliases: ['t3', 'test-3'],
      run: function() {}
    })
  };

  var HelpCommand = require('../../../lib/commands/help');

  beforeEach(function() {
    ui = new MockUI();
    analytics = new MockAnalytics();
  });

  it('should generate complete help output, including aliases', function() {
    return new HelpCommand({
      ui: ui,
      analytics: analytics,
      commands: commands,
      project: { isEmberCLIProject: function(){ return true; }},
      settings: {}
    }).validateAndRun([]).then(function() {
      expect(ui.output).to.include('Usage: ember');
      expect(ui.output).to.include('ember test-command-1');
      expect(ui.output).to.include('command-description');
      expect(ui.output).to.include('option-with-default');
      expect(ui.output).to.include('(Default: default-value)');
      expect(ui.output).to.include('required-option');
      expect(ui.output).to.include('(Required)');
      expect(ui.output).to.include('ember test-command-2');
      expect(ui.output).to.include('aliases:');
      expect(ui.output).to.not.include('ember test-command-3');
    });
  });

  it('should generate specific help output', function() {
    return new HelpCommand({
      ui: ui,
      analytics: analytics,
      commands: commands,
      project: { isEmberCLIProject: function(){ return true; }},
      settings: {}
    }).validateAndRun(['test-command-2']).then(function() {
      expect(ui.output).to.include('test-command-2');
      expect(ui.output).to.not.include('test-command-1');
      expect(ui.output).to.not.include('test-command-3');
    });
  });

  it('should generate specific help output when given an alias', function() {
    return new HelpCommand({
      ui: ui,
      analytics: analytics,
      commands: commands,
      project: { isEmberCLIProject: function(){ return true; }},
      settings: {}
    }).validateAndRun(['t1']).then(function() {
      expect(ui.output).to.include('test-command-1');
      expect(ui.output).to.not.include('test-command-2');
      expect(ui.output).to.not.include('test-command-3');
    });
  });

  describe('addon commands', function() {
    var projectWithAddons = {
      isEmberCLIProject: function(){ return true; },
      initializeAddons: function() {
        this.addons = [new AddonCommand()];
      },
      addonCommands: Project.prototype.addonCommands,
      eachAddonCommand: Project.prototype.eachAddonCommand
    };

    it('should generate complete help output, including aliases', function() {
      return new HelpCommand({
        ui: ui,
        analytics: analytics,
        commands: commands,
        project: projectWithAddons,
        settings: {}
      }).validateAndRun([]).then(function() {
        expect(ui.output).to.include('Available commands in ember-cli');
        expect(ui.output).to.include('test-command-1');
        expect(ui.output).to.include('Available commands from Ember CLI Addon Command Test');
        expect(ui.output).to.include('addon-command');
        expect(ui.output).to.include('aliases:');
      });
    });

    it('should generate specific help output', function() {
      return new HelpCommand({
        ui: ui,
        analytics: analytics,
        commands: commands,
        project: projectWithAddons,
        settings: {}
      }).validateAndRun(['addon-command']).then(function() {
        expect(ui.output).to.include('addon-command');
        expect(ui.output).to.not.include('No help entry for');
      });
    });

    it('should generate specific help output when given an alias', function() {
      return new HelpCommand({
        ui: ui,
        analytics: analytics,
        commands: commands,
        project: projectWithAddons,
        settings: {}
      }).validateAndRun(['ac']).then(function() {
        expect(ui.output).to.include('addon-command');
        expect(ui.output).to.not.include('No help entry for');
      });
    });
  });

  it('should generate "no help entry" message for non-existent commands', function() {
    return new HelpCommand({
      ui: ui,
      analytics: analytics,
      commands: commands,
      project: { isEmberCLIProject: function(){ return true; }},
      settings: {}
    }).validateAndRun(['heyyy']).then(function() {
      expect(ui.output).to.include('No help entry for');
    });
  });

  it('should generate specific help output for commands with skipHelp', function() {
    return new HelpCommand({
      ui: ui,
      analytics: analytics,
      commands: commands,
      project: { isEmberCLIProject: function(){ return true; }},
      settings: {}
    }).validateAndRun(['test-command-3']).then(function() {
      expect(ui.output).to.include('test-command-3');
      expect(ui.output).to.not.include('test-command-1');
      expect(ui.output).to.not.include('test-command-2');
    });
  });
});
