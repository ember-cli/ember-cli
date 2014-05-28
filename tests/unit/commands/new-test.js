'use strict';

var assert             = require('../../helpers/assert');
var stubCommandOptions = require('../../helpers/stub').stubCommandOptions;
var rewire             = require('rewire');

describe('new command', function() {
  var NewCommand, command;

  before(function() {
    NewCommand = rewire('../../../lib/commands/new');
  });

  afterEach(function() {
    command = null;
  });

  after(function() {
    NewCommand = null;
  });

  it('doesn\'t allow to create an application named `test`', function() {
    command = new NewCommand(
      stubCommandOptions()
    ).validateAndRun(['test']).then(function() {
      assert.ok(false, 'should have rejected with an application name of test');
    })
    .catch(function() {
      assert.equal(command.ui.output, 'We currently do not support an application name of `test`.');
    });
  });

  it('doesn\'t allow to create an application named `ember`', function() {
    command = new NewCommand(
      stubCommandOptions()
    ).validateAndRun(['ember']).then(function() {
      assert.ok(false, 'should have rejected with an application name of test');
    })
    .catch(function() {
      assert.equal(command.ui.output, 'We currently do not support an application name of `ember`.');
    });
  });
});
