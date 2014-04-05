'use strict';

var command;
var options;
var assert = require('../../helpers/assert');
var rewire = require('rewire');

function stubAdapter(name, fn) {
  var result = {};
  result[name] = fn;
  return {
    to: function() {
      return result;
    }
  };
}

describe('server command', function(){
  before(function() {
    command = rewire('../../../lib/commands/server');
    command.__set__('adapt', stubAdapter('server', function(args) {
      options = args;
    }));
  });

  after(function() {
    command = null;
  });

  it('has correct options', function(){
    command.run({
      cliOptions: {
        port: 4000
      }
    });

    assert.equal(options.port,           4000,      'has correct port');
    assert.equal(options.host,           '0.0.0.0', 'has correct host');
    assert.equal(options.liveReloadPort, 31729,     'has correct liveReload port');
  });
});
