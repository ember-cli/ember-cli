'use strict';

var assert         = require('../../helpers/assert');
var commandOptions = require('../../factories/command-options');
var AddonCommand     = require('../../../lib/commands/addon');

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

  it('doesn\'t allow to create an addon named `test`', function() {
    return command.validateAndRun(['test']).then(function() {
      assert.ok(false, 'should have rejected with an addon name of test');
    })
    .catch(function(error) {
      assert.equal(error.message, 'We currently do not support a name of `test`.');
    });
  });

  it('doesn\'t allow to create an addon named `ember`', function() {
    return command.validateAndRun(['ember']).then(function() {
      assert.ok(false, 'should have rejected with an addon name of test');
    })
    .catch(function(error) {
      assert.equal(error.message, 'We currently do not support a name of `ember`.');
    });
  });

  it('doesn\'t allow to create an addon named `vendor`', function() {
    return command.validateAndRun(['vendor']).then(function() {
      assert.ok(false, 'should have rejected with an addon name of `vendor`');
    })
    .catch(function(error) {
      assert.equal(error.message, 'We currently do not support a name of `vendor`.');
    });
  });

  it('doesn\'t allow to create an addon with a period in the name', function() {
    return command.validateAndRun(['zomg.awesome']).then(function() {
      assert.ok(false, 'should have rejected with period in the addon name');
    })
    .catch(function(error) {
      assert.equal(error.message, 'We currently do not support a name of `zomg.awesome`.');
    });
  });

  it('doesn\'t allow to create an addon with a name beginning with a number', function() {
    return command.validateAndRun(['123-my-bagel']).then(function() {
      assert.ok(false, 'should have rejected with a name beginning with a number');
    })
    .catch(function(error) {
      assert.equal(error.message, 'We currently do not support a name of `123-my-bagel`.');
    });
  });
});
