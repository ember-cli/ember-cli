'use strict';

var assert         = require('../../helpers/assert');
var commandOptions = require('../../factories/command-options');
var rewire         = require('rewire');

describe('new command', function() {
  var NewCommand, command;

  before(function() {
    NewCommand = rewire('../../../lib/commands/new');
  });

  it('doesn\'t allow to create an application named `test`', function() {
    command = new NewCommand(
      commandOptions()
    ).validateAndRun(['test']).then(function() {
      assert.ok(false, 'should have rejected with an application name of test');
    })
    .catch(function() {
      assert.equal(command.ui.output, 'We currently do not support an application name of `test`.');
    });
  });

  it('doesn\'t allow to create an application named `ember`', function() {
    command = new NewCommand(
      commandOptions()
    ).validateAndRun(['ember']).then(function() {
      assert.ok(false, 'should have rejected with an application name of test');
    })
    .catch(function() {
      assert.equal(command.ui.output, 'We currently do not support an application name of `ember`.');
    });
  });

  it('doesn\'t allow to create an application with a period in the name', function() {
    command = new NewCommand(
      commandOptions()
    ).validateAndRun(['zomg.awesome']).then(function() {
      assert.ok(false, 'should have rejected with period in the application name');
    })
    .catch(function() {
      assert.equal(command.ui.output, 'We currently do not support an application name of `zomg.awesome`.');
    });
  });
});
