'use strict';

var assert  = require('../helpers/assert');
var Command = require('../../lib/command');
var command;
var called  = false;
var ui = {};

beforeEach(function() {
  command = new Command({
    name: 'fake-command',
    run: function() {}
  });
  command.leek = {
    track: function() {
      called = true;
    }
  };
});

afterEach(function() {
  command = null;
});

describe('Leek', function() {
  it('track gets invoked on command.run()', function() {
    command.run(ui, {
      cliArgs: []
    }, {});
    assert.ok(called);
  });
});
