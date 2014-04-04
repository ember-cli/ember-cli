'use strict';

var command;
var assert        = require('../../helpers/assert');
var rewire        = require('rewire');
var stubPath      = require('../../helpers/stub').stubPath;
var stubBlueprint = require('../../helpers/stub').stubBlueprint;

describe('init command', function(){
  before(function() {
    command = rewire('../../../lib/commands/init');
    command.__set__('Blueprint', stubBlueprint());
    command.__set__('path', stubPath('test'));
  });

  after(function() {
    command = null;
  });

  it('doesn\'t allow to create an application named `test`', function(){
    assert.throw(function() {
      command.run({
        cliOptions: {}
      });
    }, 'Due to an issue with `compileES6` an application name of `test` cannot be used.');
  });
});
