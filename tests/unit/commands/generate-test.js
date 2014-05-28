'use strict';

var rewire             = require('rewire');
var assert             = require('../../helpers/assert');
var stubCommandOptions = require('../../helpers/stub').stubCommandOptions;

var Command;
var called = false;

function stubLoom() {
  return function loom() {
    called = true;
  };
}

describe('generate command', function() {
  before(function() {
    Command = rewire('../../../lib/commands/generate');
    Command.__set__('loom', stubLoom());
  });

  after(function() {
    Command = null;
  });

  it('generates a controller', function() {
    new Command(
      stubCommandOptions()
    ).validateAndRun([
      'controller',
      'application',
      'type:array'
    ]);

    assert.ok(called);
  });
});
