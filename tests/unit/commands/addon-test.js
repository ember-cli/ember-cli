'use strict';

var expect         = require('chai').expect;
var AddonCommand   = require('../../../lib/commands/addon');
var commandOptions = require('../../factories/command-options');

describe('addon command', function() {
  var command, options;

  beforeEach(function() {
    options = commandOptions({
      project: {
        isEmberCLIProject: function() {
          return false;
        }
      },
      settings: {}
    });

    command = new AddonCommand(options);
  });

  it('should contain `disableAnalytics` option', function() {
    expect(command.availableOptions.length).to.equal(7);
    expect(command.availableOptions[6]).to.deep.equal({
      key: 'disableAnalytics',
      type: Boolean,
      name: 'disable-analytics',
      required: false,
      default: false
    });
  });

  it('doesn\'t allow to create an addon named `test`', function() {
    return command.validateAndRun(['test']).then(function() {
      expect(true, 'should have rejected with an addon name of test').to.be.false();
    })
    .catch(function(error) {
      expect(error.message).to.equal('We currently do not support a name of `test`.');
    });
  });

  it('doesn\'t allow to create an addon named `ember`', function() {
    return command.validateAndRun(['ember']).then(function() {
      expect(true, 'should have rejected with an addon name of test').to.be.false();
    })
    .catch(function(error) {
      expect(error.message).to.equal('We currently do not support a name of `ember`.');
    });
  });

  it('doesn\'t allow to create an addon named `vendor`', function() {
    return command.validateAndRun(['vendor']).then(function() {
      expect(true, 'should have rejected with an addon name of `vendor`').to.be.false();
    })
    .catch(function(error) {
      expect(error.message).to.equal('We currently do not support a name of `vendor`.');
    });
  });

  it('doesn\'t allow to create an addon with a period in the name', function() {
    return command.validateAndRun(['zomg.awesome']).then(function() {      
      expect(true, 'should have rejected with period in the addon name').to.be.false();
    })
    .catch(function(error) {
      expect(error.message).to.equal('We currently do not support a name of `zomg.awesome`.');
    });
  });

  it('doesn\'t allow to create an addon with a name beginning with a number', function() {
    return command.validateAndRun(['123-my-bagel']).then(function() {
      expect(true, 'should have rejected with a name beginning with a number').to.be.false();
    })
    .catch(function(error) {
      expect(error.message).to.equal('We currently do not support a name of `123-my-bagel`.');
    });
  });
});
