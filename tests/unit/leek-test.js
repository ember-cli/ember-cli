'use strict';

var assert  = require('../helpers/assert');
var Command = require('../../lib/command');
var command;
var called = false;

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
    command.run({
      cliArgs: []
    }, {});
    assert.ok(called);
  });
});
