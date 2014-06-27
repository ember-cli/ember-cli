'use strict';

var assert         = require('../../helpers/assert');
var commandOptions = require('../../factories/command-options');
var NewCommand     = require('../../../lib/commands/new');

describe('new command', function() {
  var command, options;

  beforeEach(function() {
    options = commandOptions({
      project: {
        isEmberCLIProject: function() {
          return false;
        }
      }
    });

    command = new NewCommand(options);
  });

  it('doesn\'t allow to create an application named `test`', function() {
    return command.validateAndRun(['test']).then(function() {
      assert.ok(false, 'should have rejected with an application name of test');
    })
    .catch(function() {
      assert.equal(command.ui.output, 'We currently do not support an application name of `test`.');
    });
  });

  it('doesn\'t allow to create an application named `ember`', function() {
    return command.validateAndRun(['ember']).then(function() {
      assert.ok(false, 'should have rejected with an application name of test');
    })
    .catch(function() {
      assert.equal(command.ui.output, 'We currently do not support an application name of `ember`.');
    });
  });

  it('doesn\'t allow to create an application named `vendor`', function() {
    return command.validateAndRun(['vendor']).then(function() {
      assert.ok(false, 'should have rejected with an application name of `vendor`');
    })
    .catch(function() {
      assert.equal(command.ui.output, 'We currently do not support an application name of `vendor`.');
    });
  });

  it('doesn\'t allow to create an application with a period in the name', function() {
    return command.validateAndRun(['zomg.awesome']).then(function() {
      assert.ok(false, 'should have rejected with period in the application name');
    })
    .catch(function() {
      assert.equal(command.ui.output, 'We currently do not support an application name of `zomg.awesome`.');
    });
  });

  it('doesn\'t allow to create an application with a name beginning with a number', function() {
    return command.validateAndRun(['123-my-bagel']).then(function() {
      assert.ok(false, 'should have rejected with a name beginning with a number');
    })
    .catch(function() {
      assert.equal(command.ui.output, 'We currently do not support an application name of `123-my-bagel`.');
    });
  });
});
