'use strict';

var rewire = require('rewire');
var assert = require('../../helpers/assert');

var commandOptionsFactory = require('../../factories/command-options');

describe('generate command', function() {
  var Command;
  var args;

  before(function() {
    Command = rewire('../../../lib/commands/generate');
    Command.__set__('loom', function(arg){
      args = arg;
    });
  });

  it('generates a controller', function() {
    new Command(commandOptionsFactory()).validateAndRun([
      'controller',
      'application',
      'type:array'
    ]);

    assert.equal(args, 'controller application type:array');
  });
});
