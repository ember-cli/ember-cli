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
      }
    });
    command = new AddonCommand(options);
  });

  it('doesn\'t allow to create an addon named `test`', function() {
    return command.validateAndRun(['new', 'test']).then(function() {
      assert.ok(false, 'should have rejected with an addon name of test');
    })
    .catch(function() {
      assert.equal(command.ui.output, 'We currently do not support an addon name of `test`.');
    });
  });

  it('doesn\'t allow to create an addon named `ember`', function() {
    return command.validateAndRun(['new', 'ember']).then(function() {
      assert.ok(false, 'should have rejected with an addon name of test');
    })
    .catch(function() {
      assert.equal(command.ui.output, 'We currently do not support an addon name of `ember`.');
    });
  });

  it('doesn\'t allow to create an addon named `vendor`', function() {
    return command.validateAndRun(['new', 'vendor']).then(function() {
      assert.ok(false, 'should have rejected with an addon name of `vendor`');
    })
    .catch(function() {
      assert.equal(command.ui.output, 'We currently do not support an addon name of `vendor`.');
    });
  });

  it('doesn\'t allow to create an addon with a period in the name', function() {
    return command.validateAndRun(['new', 'zomg.awesome']).then(function() {
      assert.ok(false, 'should have rejected with period in the addon name');
    })
    .catch(function() {
      assert.equal(command.ui.output, 'We currently do not support an addon name of `zomg.awesome`.');
    });
  });

  it('doesn\'t allow to create an addon with a name beginning with a number', function() {
    return command.validateAndRun(['new', '123-my-bagel']).then(function() {
      assert.ok(false, 'should have rejected with a name beginning with a number');
    })
    .catch(function() {
      assert.equal(command.ui.output, 'We currently do not support an addon name of `123-my-bagel`.');
    });
  });
});
