'use strict';

var command;
var assert = require('../../helpers/assert');
var MockUI = require('../../helpers/mock-ui');
var rewire = require('rewire');

describe('new command', function() {
  var ui;

  before(function() {
    command = rewire('../../../lib/commands/new');
    ui = new MockUI();
  });

  after(function() {
    command = null;
  });

  it('doesn\'t allow to create an application named `test`', function() {
    assert.throw(function() {
      command.run(ui, {
        cliArgs: ['', 'test']
      });
    }, undefined);

    assert.equal(ui.output, 'Due to an issue with `compileES6` an application name of `test` cannot be used.');
  });
});
