'use strict';

var expect  = require('chai').expect;
var MockUI  = require('../../helpers/mock-ui');
var rewire  = require('rewire');
var Command = rewire('../../../lib/command');

describe('help command', function() {
  var ui;

  var commands = {
    'test-command-1': new Command({
      name: 'test-command-1',
      description: 'command-description',
      availableOptions: [
        { name: 'option-with-default', type: String, default: 'default-value' },
        { name: 'required-option', type: String, required: 'true', description: 'option-descriptionnnn' }
      ],
      run: function() {}
    }),
    'test-command-2': new Command({
      name: 'test-command-2',
      run: function() {}
    })
  };

  var helpCommand = rewire('../../../lib/commands/help');

  beforeEach(function() {
    ui = new MockUI();
  });

  it('should generate complete help output', function() {
    helpCommand.run(ui, {
      commands: commands
    });

    expect(ui.output).to.include('ember test-command-1');
    expect(ui.output).to.include('command-description');
    expect(ui.output).to.include('option-with-default');
    expect(ui.output).to.include('(Default: default-value)');
    expect(ui.output).to.include('required-option');
    expect(ui.output).to.include('(Required)');
    expect(ui.output).to.include('ember test-command-2');
  });

  it('should generate specific help output', function() {
    helpCommand.run(ui, {
      commands: commands,
      cliArgs: ['help', 'test-command-2']
    });

    expect(ui.output).to.include('test-command-2');
    expect(ui.output).to.not.include('test-command-1');
  });
});
