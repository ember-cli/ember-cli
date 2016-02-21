'use strict';

var expect         = require('chai').expect;
var commandOptions = require('../../factories/command-options');
var AddonCommand   = require('../../../lib/commands/addon');

describe('addon command', function() {
  var command;

  beforeEach(function() {
    var options = commandOptions({
      project: {
        isEmberCLIProject: function() {
          return false;
        }
      }
    });

    command = new AddonCommand(options);
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

  it('doesn\'t allow to create an addon with a name beginning with a number', function() {
    return command.validateAndRun(['123-my-bagel']).then(function() {
      expect(false, 'should have rejected with a name beginning with a number').to.be.true;
    })
    .catch(function(error) {
      expect(error.message).to.equal('We currently do not support a name of `123-my-bagel`.');
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
});
