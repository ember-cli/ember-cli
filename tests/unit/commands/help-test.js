'use strict';

var expect  = require('chai').expect;
var MockUI  = require('../../helpers/mock-ui');
var MockAnalytics  = require('../../helpers/mock-analytics');
var rewire  = require('rewire');
var Command = rewire('../../../lib/models/command');

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
    })
  };

  var HelpCommand = rewire('../../../lib/commands/help');

  beforeEach(function() {
    ui = new MockUI();
    analytics = new MockAnalytics();
  });

  it('should generate complete help output, including aliases', function() {
    new HelpCommand({
      ui: ui,
      analytics: analytics,
      commands: commands,
      project: { isEmberCLIProject: function(){ return true; }}
    }).validateAndRun([]);

    expect(ui.output).to.include('ember test-command-1');
    expect(ui.output).to.include('command-description');
    expect(ui.output).to.include('option-with-default');
    expect(ui.output).to.include('(Default: default-value)');
    expect(ui.output).to.include('required-option');
    expect(ui.output).to.include('(Required)');
    expect(ui.output).to.include('ember test-command-2');
    expect(ui.output).to.include('aliases:');
  });

  it('should generate specific help output', function() {
    new HelpCommand({
      ui: ui,
      analytics: analytics,
      commands: commands,
      project: { isEmberCLIProject: function(){ return true; }}
    }).validateAndRun(['test-command-2']);

    expect(ui.output).to.include('test-command-2');
    expect(ui.output).to.not.include('test-command-1');
  });

  it('should generate specific help output when given an alias', function() {
    new HelpCommand({
      ui: ui,
      analytics: analytics,
      commands: commands,
      project: { isEmberCLIProject: function(){ return true; }}
    }).validateAndRun(['t1']);

    expect(ui.output).to.include('test-command-1');
    expect(ui.output).to.not.include('test-command-2');
  });

  it('should generate "no help entry" message for non-existent commands', function() {
    new HelpCommand({
      ui: ui,
      analytics: analytics,
      commands: commands,
      project: { isEmberCLIProject: function(){ return true; }}
    }).validateAndRun(['heyyy']);

    expect(ui.output).to.include('No help entry for');
  });
});
