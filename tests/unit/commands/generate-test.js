'use strict';

var describe = require('mocha').describe;
var before = require('mocha').beforeEach;
var after = require('mocha').afterEach;
var it = require('mocha').it;

var command;

describe('generate command', function(){
  before(function() {
    command = require('../../../lib/commands/generate');
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
    //TODO: figure out how to test this more thoroughly
  });
});
