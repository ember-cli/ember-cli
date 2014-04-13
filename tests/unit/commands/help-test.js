'use strict';

var expect  = require('chai').expect;
var MockUI  = require('../../helpers/mock-ui');
var rewire  = require('rewire');
var rewire  = require('rewire');
var Command = rewire('../../../lib/command');

describe('help command', function() {
  var ui, command, environment;

  before(function() {
    ui = new MockUI();
    command = rewire('../../../lib/commands/help');
    environment = {
      commands: {
        testCommand1: new Command({
          name: 'test-command-1',
          description: 'command-description',
          availableOptions: [
            { name: 'option-with-default', type: String, default: 'default-value' },
            { name: 'required-option', type: String, required: 'true', description: 'option-descriptionnnn' }
          ],
          run: function() {}
        }),
        testCommand2: new Command({
          name: 'test-command-2',
          run: function() {}
        })
      }
    };
  });

  it('should generate complete help output', function() {
    command.run(ui, environment);
    expect(ui.output[0]).to.include('ember test-command-1');
    expect(ui.output[0]).to.include('command-description');
    expect(ui.output[0]).to.include('option-with-default');
    expect(ui.output[0]).to.include('(Default: default-value)');
    expect(ui.output[0]).to.include('required-option');
    expect(ui.output[0]).to.include('(Required)');
    expect(ui.output[0]).to.include('ember test-command-2');
  });
});
