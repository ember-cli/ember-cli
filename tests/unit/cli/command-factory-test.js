'use strict';
/*jshint expr: true*/

var expect         = require('chai').expect;
var CommandFactory = require('../../../lib/cli/command-factory');
var UI             = require('../../../lib/ui');
var through        = require('through');
var Command        = require('../../../lib/command');

var environment = {
  commands: {
    serve: new Command({
      name: 'serve',
      aliases: ['s'],
      works: 'everywhere',
      availableOptions: [
        { name: 'port', key: 'port', type: Number, default: 4200, required: true }
      ],
      run: function() {},
      usageInstructions: function() {}
    }),
    developEmberCLI: new Command({
      name: 'develop-ember-cli',
      works: 'everywhere',
      availableOptions: [
        { name: 'package-name', key: 'packageName', type: String, required: true }
      ],
      run: function() {},
      usageInstructions: function() {}
    }),
    insideProject: new Command({
      name: 'inside-project',
      works: 'insideProject',
      run: function() {},
      usageInstructions: function() {}
    }),
    outsideProject: new Command({
      name: 'outside-project',
      works: 'outsideProject',
      run: function() {},
      usageInstructions: function() {}
    }),
    everywhere: new Command({
      name: 'everywhere',
      works: 'everywhere',
      run: function() {},
      usageInstructions: function() {}
    }),
    help: new Command({
      name: 'help',
      run: function() {},
    })
  },
  isWithinProject: true
};

describe('cli/command-factory.js', function() {
  var output;
  var ui;

  before(function(){
    output = [];

    ui = new UI({
      inputStream: through(),
      outputStream: through(function(data) {
        output.push(data);
      })
    });
  });

  function commandFromArgs(opts) {
    return new CommandFactory({
      ui: ui,
      commands: environment.commands,
      isWithinProject: typeof opts.isWithinProject === 'undefined' ? environment.isWithinProject : opts.isWithinProject,
    }).commandFromArgs(opts.cliArgs);
  }

  it('commandFromArgs() should find commands by name and aliases.', function() {
    // Valid commands

    expect(commandFromArgs({ cliArgs: ['serve'] })).to.exist;
    expect(commandFromArgs({ cliArgs: ['s'] })).to.exist;

    // Invalid command
    expect(commandFromArgs({ cliArgs: ['something-else'] })).to.be.null;
    expect(output.shift()).to.match(/command.*something-else.*is invalid/);
  });

  it('commandFromArgs() should find the command options.', function() {
    expect(commandFromArgs({ cliArgs: ['s', '--port', '80'] }).commandOptions).to.include({
      port: 80
    });
  });

  it('commandFromArgs() should find abbreviated command options.', function() {
    expect(commandFromArgs({ cliArgs: ['s', 's', '-p', '80'] }).commandOptions).to.include({
      port: 80
    });
  });

  it('commandFromArgs() should set default option values.', function() {
    expect(commandFromArgs({ cliArgs: ['s']}).commandOptions).to.include({
      port: 4200
    });
  });

  it('commandFromArgs() should print a message if a required option is missing.', function() {
    expect(commandFromArgs({ cliArgs: ['develop-ember-cli']})).to.be.null;
    expect(output.shift()).to.match(/requires the option.*package-name/);
  });

  it('commandFromArgs() should print a message if a task cannot need the presence/absence of a project.', function() {
    // Inside project
    expect(commandFromArgs({ cliArgs: ['inside-project']})).to.exist;
    expect(commandFromArgs({ cliArgs: ['outside-project']})).to.be.null;
    expect(output.shift()).to.match(/You cannot use.*inside an ember-cli project/);
    expect(commandFromArgs({ cliArgs: ['everywhere']})).to.exist;

    // Outside project
    expect(commandFromArgs({ cliArgs: ['inside-project'], isWithinProject: false})).to.null;
    expect(output.shift()).to.match(/You have to be inside an ember-cli project/);
    expect(commandFromArgs({ cliArgs: ['outside-project'], isWithinProject: false })).to.be.exist;
    expect(commandFromArgs({ cliArgs: ['everywhere'],      isWithinProject: false })).to.exist;
  });
});
