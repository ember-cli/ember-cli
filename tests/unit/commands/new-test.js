'use strict';

var command;
var assert = require('../../helpers/assert');
var MockUI = require('../../helpers/mock-ui');
var rewire = require('rewire');
var ui;

describe('new command', function() {
  before(function() {
    command = rewire('../../../lib/commands/new');
    ui = new MockUI();
  });

  after(function() {
    command = null;
  });

  it('doesn\'t allow to create an application named `test`', function() {
    assert.throw(function() {
      command.run({
        cliArgs: ['', 'test'],
        ui: ui
      });
    }, undefined);

    assert.equal(ui.output[0], 'Due to an issue with `compileES6` an application name of `test` cannot be used.');
  });
});
