'use strict';

var expect  = require('chai').expect;
var MockUI  = require('../../helpers/mock-ui');
var rewire  = require('rewire');
var Command = rewire('../../../lib/command');

describe('help command', function() {
  var ui, helpCommand, commands;

  before(function() {
    ui = new MockUI();
    helpCommand = rewire('../../../lib/commands/help');
    commands = {
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
  });

  it('should generate complete help output', function() {
    ui.reset();

    helpCommand.run(ui, {
      commands: commands
    });

    expect(ui.output[1]).to.include('ember test-command-1');
    expect(ui.output[1]).to.include('command-description');
    expect(ui.output[1]).to.include('option-with-default');
    expect(ui.output[1]).to.include('(Default: default-value)');
    expect(ui.output[1]).to.include('required-option');
    expect(ui.output[1]).to.include('(Required)');
    expect(ui.output[2]).to.include('ember test-command-2');
  });

  it('should generate specific help output', function() {
    ui.reset();

    helpCommand.run(ui, {
      commands: commands,
      cliArgs: ['help', 'test-command-2']
    });

    expect(ui.output[1]).to.include('test-command-2');
    expect(ui.output[1]).to.not.include('test-command-1');
  });
});
