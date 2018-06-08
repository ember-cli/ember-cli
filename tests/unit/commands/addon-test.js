'use strict';

const expect = require('../../chai').expect;
const commandOptions = require('../../factories/command-options');
const map = require('ember-cli-lodash-subset').map;
const AddonCommand = require('../../../lib/commands/addon');
const Blueprint = require('../../../lib/models/blueprint');
const experiments = require('../../../lib/experiments');
const td = require('testdouble');

describe('addon command', function() {
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

    command = new AddonCommand(options);
  });

  afterEach(function() {
    td.reset();
  });

  it('doesn\'t allow to create an addon named `test`', function() {
    return expect(command.validateAndRun(['test'])).to.be.rejected.then(error => {
      expect(error.message).to.equal('We currently do not support a name of `test`.');
    });
  });

  it('doesn\'t allow to create an addon named `ember`', function() {
    return expect(command.validateAndRun(['ember'])).to.be.rejected.then(error => {
      expect(error.message).to.equal('We currently do not support a name of `ember`.');
    });
  });

  it('doesn\'t allow to create an addon named `Ember`', function() {
    return expect(command.validateAndRun(['Ember'])).to.be.rejected.then(error => {
      expect(error.message).to.equal('We currently do not support a name of `Ember`.');
    });
  });

  it('doesn\'t allow to create an addon named `ember-cli`', function() {
    return expect(command.validateAndRun(['ember-cli'])).to.be.rejected.then(error => {
      expect(error.message).to.equal('We currently do not support a name of `ember-cli`.');
    });
  });

  it('doesn\'t allow to create an addon named `vendor`', function() {
    return expect(command.validateAndRun(['vendor'])).to.be.rejected.then(error => {
      expect(error.message).to.equal('We currently do not support a name of `vendor`.');
    });
  });

  it('doesn\'t allow to create an addon with a period in the name', function() {
    return expect(command.validateAndRun(['zomg.awesome'])).to.be.rejected.then(error => {
      expect(error.message).to.equal('We currently do not support a name of `zomg.awesome`.');
    });
  });

  it('doesn\'t allow to create an addon with a name beginning with a number', function() {
    return expect(command.validateAndRun(['123-my-bagel'])).to.be.rejected.then(error => {
      expect(error.message).to.equal('We currently do not support a name of `123-my-bagel`.');
    });
  });

  if (!experiments.MODULE_UNIFICATION) {
    it('doesn\'t allow to create an addon when the name is a period', function() {
      return expect(command.validateAndRun(['.'])).to.be.rejected.then(error => {
        expect(error.message).to.equal('Trying to generate an addon structure in this directory? Use `ember init` instead.');
      });
    });
  }

  it('registers blueprint options in beforeRun', function() {
    td.replace(Blueprint, 'lookup', td.function());

    td.when(Blueprint.lookup('addon'), { ignoreExtraArgs: true }).thenReturn({
      availableOptions: [
        { name: 'custom-blueprint-option', type: String },
      ],
    });

    command.beforeRun(['addon']);
    expect(map(command.availableOptions, 'name')).to.contain('custom-blueprint-option');
  });
});
