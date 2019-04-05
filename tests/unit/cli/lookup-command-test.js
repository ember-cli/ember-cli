'use strict';

const expect = require('chai').expect;
const lookupCommand = require('../../../lib/cli/lookup-command');
const Command = require('../../../lib/models/command');
const Project = require('../../../lib/models/project');
const MockUI = require('console-ui/mock');
const AddonCommand = require('../../fixtures/addon/commands/addon-command');
const OtherCommand = require('../../fixtures/addon/commands/other-addon-command');
const ClassCommand = require('../../fixtures/addon/commands/addon-command-class');
const OverrideCommand = require('../../fixtures/addon/commands/addon-override-intentional');

let commands = {
  serve: Command.extend({
    name: 'serve',
    aliases: ['s'],
    works: 'everywhere',
    availableOptions: [{ name: 'port', key: 'port', type: Number, default: 4200, required: true }],
    run() {},
  }),
};

function AddonServeCommand() {
  return this;
}
AddonServeCommand.prototype.includedCommands = function() {
  return {
    Serve: {
      name: 'serve',
      description: 'overrides the serve command',
    },
  };
};

describe('cli/lookup-command.js', function() {
  let ui;
  let project = {
    isEmberCLIProject() {
      return true;
    },
    initializeAddons() {
      this.addons = [new AddonCommand(), new OtherCommand(), new ClassCommand()];
    },
    addonCommands: Project.prototype.addonCommands,
    eachAddonCommand: Project.prototype.eachAddonCommand,
  };

  before(function() {
    ui = new MockUI();
  });

  it('lookupCommand() should find commands by name and aliases.', function() {
    // Valid commands

    expect(lookupCommand(commands, 'serve')).to.exist;
    expect(lookupCommand(commands, 's')).to.exist;
  });

  it('lookupCommand() should find commands that addons add by name and aliases.', function() {
    let command, Command;

    Command = lookupCommand(commands, 'addon-command', [], {
      project,
      ui,
    });
    command = new Command({
      ui,
      project,
    });

    expect(command.name).to.equal('addon-command');

    Command = lookupCommand(commands, 'ac', [], {
      project,
      ui,
    });

    command = new Command({
      ui,
      project,
    });

    expect(command.name).to.equal('addon-command');

    Command = lookupCommand(commands, 'other-addon-command', [], {
      project,
      ui,
    });

    command = new Command({
      ui,
      project,
    });

    expect(command.name).to.equal('other-addon-command');

    Command = lookupCommand(commands, 'oac', [], {
      project,
      ui,
    });

    command = new Command({
      ui,
      project,
    });

    expect(command.name).to.equal('other-addon-command');

    Command = lookupCommand(commands, 'class-addon-command', [], {
      project,
      ui,
    });

    command = new Command({
      ui,
      project,
    });

    expect(command.name).to.equal('class-addon-command');
  });

  it('lookupCommand() should write out a warning when overriding a core command', function() {
    project = {
      isEmberCLIProject() {
        return true;
      },
      initializeAddons() {
        this.addons = [new AddonServeCommand()];
      },
      addonCommands: Project.prototype.addonCommands,
      eachAddonCommand: Project.prototype.eachAddonCommand,
    };

    lookupCommand(commands, 'serve', [], {
      project,
      ui,
    });

    expect(ui.output).to.match(
      /WARNING: An ember-addon has attempted to override the core command "serve"\. The core command will be used.*/
    );
  });

  it('lookupCommand() should write out a warning when overriding a core command and allow it if intentional', function() {
    project = {
      isEmberCLIProject() {
        return true;
      },
      initializeAddons() {
        this.addons = [new OverrideCommand()];
      },
      addonCommands: Project.prototype.addonCommands,
      eachAddonCommand: Project.prototype.eachAddonCommand,
    };

    lookupCommand(commands, 'serve', [], {
      project,
      ui,
    });

    expect(ui.output).to.match(
      /WARNING: An ember-addon has attempted to override the core command "serve"\. The addon command will be used as the overridding was explicit.*/
    );
  });

  it('lookupCommand() should return UnknownCommand object when command name is not present.', function() {
    let Command = lookupCommand(commands, 'something-else', [], {
      project,
      ui,
    });
    let command = new Command({
      ui,
      project,
    });

    expect(command.name).to.equal('something-else');

    expect(() => {
      command.validateAndRun([]);
    }).to.throw(/command.*something-else.*is invalid/);
  });
});
