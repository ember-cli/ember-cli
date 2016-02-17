'use strict';

var expect         = require('chai').expect;
var map          = require('lodash/map');
var commandOptions = require('../../factories/command-options');
var stub           = require('../../helpers/stub');
var NewCommand     = require('../../../lib/commands/new');
var Promise        = require('../../../lib/ext/promise');
var Blueprint      = require('../../../lib/models/blueprint');
var Command        = require('../../../lib/models/command');
var Task           = require('../../../lib/models/task');

var safeRestore = stub.safeRestore;
stub = stub.stub;

describe('new command', function() {
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

    command = new NewCommand(options);
  });

  afterEach(function() {
    safeRestore(Blueprint, 'lookup');
  });

  it('doesn\'t allow to create an application named `test`', function() {
    return command.validateAndRun(['test']).then(function() {
      expect(false, 'should have rejected with an application name of test').to.be.ok;
    })
    .catch(function(error) {
      expect(error.message).to.equal('We currently do not support a name of `test`.');
    });
  });

  it('doesn\'t allow to create an application named `ember`', function() {
    return command.validateAndRun(['ember']).then(function() {
      expect(false, 'should have rejected with an application name of ember').to.be.ok;
    })
    .catch(function(error) {
      expect(error.message).to.equal('We currently do not support a name of `ember`.');
    });
  });

  it('doesn\'t allow to create an application named `Ember`', function() {
    return command.validateAndRun(['Ember']).then(function() {
      expect(false, 'should have rejected with an application name of Ember').to.be.ok;
    })
    .catch(function(error) {
      expect(error.message).to.equal('We currently do not support a name of `Ember`.');
    });
  });

  it('doesn\'t allow to create an application named `ember-cli`', function() {
    return command.validateAndRun(['ember-cli']).then(function() {
      expect(false, 'should have rejected with an application name of ember-cli').to.be.ok;
    })
    .catch(function(error) {
      expect(error.message).to.equal('We currently do not support a name of `ember-cli`.');
    });
  });

  it('doesn\'t allow to create an application named `vendor`', function() {
    return command.validateAndRun(['vendor']).then(function() {
      expect(false, 'should have rejected with an application name of `vendor`').to.be.ok;
    })
    .catch(function(error) {
      expect(error.message).to.equal('We currently do not support a name of `vendor`.');
    });
  });

  it('doesn\'t allow to create an application with a period in the name', function() {
    return command.validateAndRun(['zomg.awesome']).then(function() {
      expect(false, 'should have rejected with period in the application name').to.be.ok;
    })
    .catch(function(error) {
      expect(error.message).to.equal('We currently do not support a name of `zomg.awesome`.');
    });
  });

  it('doesn\'t allow to create an application with a name beginning with a number', function() {
    return command.validateAndRun(['123-my-bagel']).then(function() {
      expect(false, 'should have rejected with a name beginning with a number').to.be.ok;
    })
    .catch(function(error) {
      expect(error.message).to.equal('We currently do not support a name of `123-my-bagel`.');
    });
  });

  it('shows a suggestion messages when the application name is a period', function() {
    return command.validateAndRun(['.']).then(function() {
      expect(false, 'should have rejected with a name `.`').to.be.ok;
    })
    .catch(function(error) {
      expect(error.message).to.equal('Trying to generate an application structure in this directory? Use `ember init` instead.');
    });
  });

  it('registers blueprint options in beforeRun', function() {
    stub(Blueprint, 'lookup', function(name) {
      expect(name).to.equal('app');
      return {
        availableOptions: [
          { name: 'custom-blueprint-option', type: String }
        ]
      };
    }, true);

    command.beforeRun(['app']);
    expect(map(command.availableOptions, 'name')).to.contain('custom-blueprint-option');
  });

  it('passes command options through to init command', function() {
    command.tasks.CreateAndStepIntoDirectory = Task.extend({
      run: function() {
        return Promise.resolve();
      }
    });

    command.commands.Init = Command.extend({
      run: function(commandOptions) {
        expect(commandOptions).to.contain.keys('customOption');
        expect(commandOptions.customOption).to.equal('customValue');
        return Promise.resolve('Called run');
      }
    });

    stub(Blueprint, 'lookup', function(name) {
      expect(name).to.equal('app');
      return {
        availableOptions: [
          { name: 'custom-blueprint-option', type: String }
        ]
      };
    }, true);

    return command.validateAndRun(['foo', '--custom-option=customValue']).then(function(reason) {
      expect(reason).to.equal('Called run');
    });
  });
});
