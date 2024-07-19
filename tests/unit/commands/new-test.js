'use strict';

const { expect } = require('chai');
const commandOptions = require('../../factories/command-options');
const NewCommand = require('../../../lib/commands/new');
const Blueprint = require('../../../lib/models/blueprint');
const Command = require('../../../lib/models/command');
const Task = require('../../../lib/models/task');
const InteractiveNewTask = require('../../../lib/tasks/interactive-new');
const td = require('testdouble');

describe('new command', function () {
  let command;

  beforeEach(function () {
    let options = commandOptions({
      project: {
        isEmberCLIProject() {
          return false;
        },
        blueprintLookupPaths() {
          return [];
        },
      },
    });

    command = new NewCommand(options);

    td.replace(Blueprint, 'lookup', td.function());
  });

  afterEach(function () {
    td.reset();
  });

  it("doesn't allow to create an application named `test`", async function () {
    let { message } = await expect(command.validateAndRun(['test'])).to.be.rejected;
    expect(message).to.equal('We currently do not support a name of `test`.');
  });

  it("doesn't allow to create an application named `ember`", async function () {
    let { message } = await expect(command.validateAndRun(['ember'])).to.be.rejected;
    expect(message).to.equal('We currently do not support a name of `ember`.');
  });

  it("doesn't allow to create an application named `Ember`", async function () {
    let { message } = await expect(command.validateAndRun(['Ember'])).to.be.rejected;
    expect(message).to.equal('We currently do not support a name of `Ember`.');
  });

  it("doesn't allow to create an application named `ember-cli`", async function () {
    let { message } = await expect(command.validateAndRun(['ember-cli'])).to.be.rejected;
    expect(message).to.equal('We currently do not support a name of `ember-cli`.');
  });

  it("doesn't allow to create an application named `vendor`", async function () {
    let { message } = await expect(command.validateAndRun(['vendor'])).to.be.rejected;
    expect(message).to.equal('We currently do not support a name of `vendor`.');
  });

  it("doesn't allow to create an application with a period in the name", async function () {
    let { message } = await expect(command.validateAndRun(['zomg.awesome'])).to.be.rejected;
    expect(message).to.equal('We currently do not support a name of `zomg.awesome`.');
  });

  it("doesn't allow to create an application with a name beginning with a number", async function () {
    let { message } = await expect(command.validateAndRun(['123-my-bagel'])).to.be.rejected;
    expect(message).to.equal('We currently do not support a name of `123-my-bagel`.');
  });

  it('shows a suggestion messages when the application name is a period', async function () {
    let { message } = await expect(command.validateAndRun(['.'])).to.be.rejected;
    expect(message).to.equal(
      `Trying to generate an application structure in this directory? Use \`ember init\` instead.`
    );
  });

  it('registers blueprint options in beforeRun', function () {
    td.when(Blueprint.lookup('app'), { ignoreExtraArgs: true }).thenReturn({
      availableOptions: [{ name: 'custom-blueprint-option', type: String }],
    });

    command.beforeRun(['app']);
    expect(command.availableOptions.map(({ name }) => name)).to.contain('custom-blueprint-option');
  });

  it('passes command options through to init command', async function () {
    command.tasks.CreateAndStepIntoDirectory = class extends Task {
      run() {
        return Promise.resolve();
      }
    };

    command.commands.Init = Command.extend({
      name: 'init',

      run(commandOptions) {
        expect(commandOptions).to.contain.keys('customOption');
        expect(commandOptions.customOption).to.equal('customValue');
        return Promise.resolve('Called run');
      },
    });

    td.when(Blueprint.lookup('app'), { ignoreExtraArgs: true }).thenReturn({
      availableOptions: [{ name: 'custom-blueprint-option', type: String }],
    });

    let reason = await command.validateAndRun(['foo', '--custom-option=customValue']);
    expect(reason).to.equal('Called run');
  });

  describe('interactive', function () {
    it('interactive new is entered when no app/addon name is provided', async function () {
      class InteractiveNewTaskMock extends InteractiveNewTask {
        run(newCommandOptions) {
          return super.run(newCommandOptions, {
            blueprint: 'addon',
            name: 'foo',
            langSelection: 'en-US',
            packageManager: 'npm',
            ciProvider: 'github',
          });
        }
      }

      class CreateAndStepIntoDirectoryTask extends Task {
        run() {}
      }

      const InitCommand = Command.extend({
        name: 'init',

        run(commandOptions) {
          expect(commandOptions).to.deep.include({
            blueprint: 'addon',
            name: 'foo',
            lang: 'en-US',
            packageManager: 'npm',
            ciProvider: 'github',
          });
        },
      });

      command.tasks.InteractiveNew = InteractiveNewTaskMock;
      command.tasks.CreateAndStepIntoDirectory = CreateAndStepIntoDirectoryTask;
      command.commands.Init = InitCommand;

      expect(command.validateAndRun([])).to.be.fulfilled;
    });

    it('interactive new is entered when the `--interactive` flag is provided', async function () {
      class InteractiveNewTaskMock extends InteractiveNewTask {
        run(newCommandOptions) {
          return super.run(newCommandOptions, {
            blueprint: 'app',
            name: newCommandOptions.name,
            langSelection: 'nl-BE',
            packageManager: 'yarn',
            ciProvider: 'travis',
          });
        }
      }

      class CreateAndStepIntoDirectoryTask extends Task {
        run() {}
      }

      const InitCommand = Command.extend({
        name: 'init',

        run(commandOptions) {
          expect(commandOptions).to.deep.include({
            blueprint: 'app',
            name: 'bar',
            lang: 'nl-BE',
            packageManager: 'yarn',
            ciProvider: 'travis',
          });
        },
      });

      command.tasks.InteractiveNew = InteractiveNewTaskMock;
      command.tasks.CreateAndStepIntoDirectory = CreateAndStepIntoDirectoryTask;
      command.commands.Init = InitCommand;

      expect(command.validateAndRun(['bar', '--interactive'])).to.be.fulfilled;
    });

    it('interactive new is entered when the `-i` flag is provided', async function () {
      class InteractiveNewTaskMock extends InteractiveNewTask {
        run(newCommandOptions) {
          return super.run(newCommandOptions, {
            blueprint: 'app',
            name: newCommandOptions.name,
            langSelection: 'fr-BE',
            packageManager: null,
            ciProvider: null,
          });
        }
      }

      class CreateAndStepIntoDirectoryTask extends Task {
        run() {}
      }

      const InitCommand = Command.extend({
        name: 'init',

        run(commandOptions) {
          expect(commandOptions).does.not.have.key('packageManager');
          expect(commandOptions).to.deep.include({
            blueprint: 'app',
            name: 'baz',
            lang: 'fr-BE',
            ciProvider: 'github',
          });
        },
      });

      command.tasks.InteractiveNew = InteractiveNewTaskMock;
      command.tasks.CreateAndStepIntoDirectory = CreateAndStepIntoDirectoryTask;
      command.commands.Init = InitCommand;

      expect(command.validateAndRun(['baz', '-i'])).to.be.fulfilled;
    });
  });
});
