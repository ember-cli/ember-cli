'use strict';

var command;
var assert        = require('../../helpers/assert');
var rewire        = require('rewire');
var stubBlueprint = require('../../helpers/stub').stubBlueprint;

describe('new command', function(){
  before(function() {
    command = rewire('../../../lib/commands/new');
    command.__set__('Blueprint', stubBlueprint());
  });

  after(function() {
    command = null;
  });

  it('doesn\'t allow to create an application named `test`', function(){
    assert.throw(function() {
      command.run({
        args: ['test'],
        cliOptions: {}
      });
    }, 'Due to an issue with `compileES6` an application name of `test` cannot be used.');
  });
});
