'use strict';
/*jshint expr: true*/

var expect         = require('chai').expect;
var lookupCommand  = require('../../../lib/cli/lookup-command');
var Command  = require('../../../lib/models/command');
var MockUI         = require('../../helpers/mock-ui');

var commands = {
  serve: Command.extend({
    name: 'serve',
    aliases: ['s'],
    works: 'everywhere',
    availableOptions: [
      { name: 'port', key: 'port', type: Number, default: 4200, required: true }
    ],
    run: function() {}
  })
};

describe('cli/lookup-command.js', function() {
  var ui;

  before(function(){
    ui = new MockUI();
  });

  it('lookupCommand() should find commands by name and aliases.', function() {
    // Valid commands

    expect(lookupCommand(commands, 'serve')).to.exist;
    expect(lookupCommand(commands, 's')).to.exist;
  });

  it('lookupCommand() should return UnknownCommand object when command name is not present.', function() {
    var Command = lookupCommand(commands, 'something-else');
    var command = new Command({
      ui: ui,
      project: { isEmberCLIProject: function(){ return true; }}
    });
    command.validateAndRun([]);
    expect(ui.output).to.match(/command.*something-else.*is invalid/);
  });
});
