'use strict';

var rewire  = require('rewire');
var assert  = require('../../helpers/assert');

var command;
var called = false;

function stubLoom() {
  return function loom() {
    called = true;
  };
}
describe('generate command', function(){

  before(function() {
    command = rewire('../../../lib/commands/generate');
    command.__set__('loom', stubLoom());
  });

  after(function() {
    command = null;
  });

  it('generates a controller', function(){
    command.run({
      args: [
        'controller',
        'application',
        'type:array'
      ]
    });

    assert.ok(called);
  });
});
