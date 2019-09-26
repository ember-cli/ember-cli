'use strict';

const expect = require('../../chai').expect;
const map = require('ember-cli-lodash-subset').map;
const commandOptions = require('../../factories/command-options');
const NewCommand = require('../../../lib/commands/new');
const Promise = require('rsvp').Promise;
const Blueprint = require('../../../lib/models/blueprint');
const Command = require('../../../lib/models/command');
const Task = require('../../../lib/models/task');
const td = require('testdouble');

describe('new command', function() {
  let command;

  beforeEach(function() {
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

  afterEach(function() {
    td.reset();
  });

  it("doesn't allow to create an application named `test`", function() {
    return expect(command.validateAndRun(['test'])).to.be.rejected.then(error => {
      expect(error.message).to.equal('We currently do not support a name of `test`.');
    });
  });

  it("doesn't allow to create an application named `ember`", function() {
    return expect(command.validateAndRun(['ember'])).to.be.rejected.then(error => {
      expect(error.message).to.equal('We currently do not support a name of `ember`.');
    });
  });

  it("doesn't allow to create an application named `Ember`", function() {
    return expect(command.validateAndRun(['Ember'])).to.be.rejected.then(error => {
      expect(error.message).to.equal('We currently do not support a name of `Ember`.');
    });
  });

  it("doesn't allow to create an application named `ember-cli`", function() {
    return expect(command.validateAndRun(['ember-cli'])).to.be.rejected.then(error => {
      expect(error.message).to.equal('We currently do not support a name of `ember-cli`.');
    });
  });

  it("doesn't allow to create an application named `vendor`", function() {
    return expect(command.validateAndRun(['vendor'])).to.be.rejected.then(error => {
      expect(error.message).to.equal('We currently do not support a name of `vendor`.');
    });
  });

  it("doesn't allow to create an application with a period in the name", function() {
    return expect(command.validateAndRun(['zomg.awesome'])).to.be.rejected.then(error => {
      expect(error.message).to.equal('We currently do not support a name of `zomg.awesome`.');
    });
  });

  it("doesn't allow to create an application with a name beginning with a number", function() {
    return expect(command.validateAndRun(['123-my-bagel'])).to.be.rejected.then(error => {
      expect(error.message).to.equal('We currently do not support a name of `123-my-bagel`.');
    });
  });

  it('shows a suggestion messages when the application name is a period', function() {
    return expect(command.validateAndRun(['.'])).to.be.rejected.then(error => {
      expect(error.message).to.equal(
        `Trying to generate an application structure in this directory? Use \`ember init\` instead.`
      );
    });
  });

  it('registers blueprint options in beforeRun', function() {
    td.when(Blueprint.lookup('app'), { ignoreExtraArgs: true }).thenReturn({
      availableOptions: [{ name: 'custom-blueprint-option', type: String }],
    });

    command.beforeRun(['app']);
    expect(map(command.availableOptions, 'name')).to.contain('custom-blueprint-option');
  });

  it('passes command options through to init command', function() {
    command.tasks.CreateAndStepIntoDirectory = Task.extend({
      run() {
        return Promise.resolve();
      },
    });

    command.commands.Init = Command.extend({
      run(commandOptions) {
        expect(commandOptions).to.contain.keys('customOption');
        expect(commandOptions.customOption).to.equal('customValue');
        return Promise.resolve('Called run');
      },
    });

    td.when(Blueprint.lookup('app'), { ignoreExtraArgs: true }).thenReturn({
      availableOptions: [{ name: 'custom-blueprint-option', type: String }],
    });

    return command.validateAndRun(['foo', '--custom-option=customValue']).then(function(reason) {
      expect(reason).to.equal('Called run');
    });
  });
});
