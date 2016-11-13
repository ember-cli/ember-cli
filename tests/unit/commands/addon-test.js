'use strict';

var expect         = require('chai').expect;
var commandOptions = require('../../factories/command-options');
var map            = require('ember-cli-lodash-subset').map;
var AddonCommand   = require('../../../lib/commands/addon');
var Blueprint      = require('../../../lib/models/blueprint');
var Task           = require('../../../lib/models/task');
var Command        = require('../../../lib/models/command');
var Promise        = require('../../../lib/ext/promise');
var td = require('testdouble');

describe('addon command', function() {
  var command;

  beforeEach(function() {
    var options = commandOptions({
      project: {
        isEmberCLIProject: function() {
          return false;
        },
        blueprintLookupPaths: function() {
          return [];
        }
      }
    });

    command = new AddonCommand(options);
  });

  afterEach(function() {
    td.reset();
  });

  it('allows an addon name beginning with a number', function() {
    command.tasks.CreateAndStepIntoDirectory = Task.extend({
      run: function() {
        return Promise.resolve();
      }
    });

    command.commands.Init = Command.extend({
      run: function() {
        return Promise.resolve();
      }
    });

    return command.validateAndRun(['123-my-bagel']).then(function() {
      expect(true, 'addon name was valid').to.be.true;
    });
  });

  it('doesn\'t allow to create an addon named `test`', function() {
    return command.validateAndRun(['test']).then(function() {
      expect(false, 'should have rejected with an addon name of test').to.be.true;
    })
    .catch(function(error) {
      expect(error.message).to.equal('We currently do not support a name of `test`.');
    });
  });

  it('doesn\'t allow to create an addon named `ember`', function() {
    return command.validateAndRun(['ember']).then(function() {
      expect(false, 'should have rejected with an addon name of test').to.be.true;
    })
    .catch(function(error) {
      expect(error.message).to.equal('We currently do not support a name of `ember`.');
    });
  });

  it('doesn\'t allow to create an addon named `Ember`', function() {
    return command.validateAndRun(['Ember']).then(function() {
      expect(false, 'should have rejected with an addon name of Ember').to.be.true;
    })
    .catch(function(error) {
      expect(error.message).to.equal('We currently do not support a name of `Ember`.');
    });
  });

  it('doesn\'t allow to create an addon named `ember-cli`', function() {
    return command.validateAndRun(['ember-cli']).then(function() {
      expect(false, 'should have rejected with an addon name of ember-cli').to.be.true;
    })
    .catch(function(error) {
      expect(error.message).to.equal('We currently do not support a name of `ember-cli`.');
    });
  });

  it('doesn\'t allow to create an addon named `vendor`', function() {
    return command.validateAndRun(['vendor']).then(function() {
      expect(false, 'should have rejected with an addon name of `vendor`').to.be.true;
    })
    .catch(function(error) {
      expect(error.message).to.equal('We currently do not support a name of `vendor`.');
    });
  });

  it('doesn\'t allow to create an addon with a period in the name', function() {
    return command.validateAndRun(['zomg.awesome']).then(function() {
      expect(false, 'should have rejected with period in the addon name').to.be.true;
    })
    .catch(function(error) {
      expect(error.message).to.equal('We currently do not support a name of `zomg.awesome`.');
    });
  });

  it('doesn\'t allow to create an addon when the name is a period', function() {
    return command.validateAndRun(['.']).then(function() {
      expect(false, 'should have rejected with period as the addon name').to.be.true;
    })
    .catch(function(error) {
      expect(error.message).to.equal('Trying to generate an addon structure in this directory? Use `ember init` instead.');
    });
  });

  it('registers blueprint options in beforeRun', function() {
    td.replace(Blueprint, 'lookup', td.function());

    td.when(Blueprint.lookup('addon'), {ignoreExtraArgs: true}).thenReturn({
      availableOptions: [
        { name: 'custom-blueprint-option', type: String }
      ]
    });

    command.beforeRun(['addon']);
    expect(map(command.availableOptions, 'name')).to.contain('custom-blueprint-option');
  });
});
