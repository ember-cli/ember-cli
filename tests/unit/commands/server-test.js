'use strict';

var command;
var assert = require('../../helpers/assert');
var rewire = require('rewire');
var stub = require('../../helpers/stub').stub;
var env;

describe('server command', function() {
  before(function() {
    command = rewire('../../../lib/commands/serve');
    env = {
      tasks: {
        serve: {
          run: function() { }
        }
      }
    };

    stub(env.tasks.serve, 'run');
  });

  after(function() {
    command = null;
  });

  it('has correct options', function() {
    command.run(env, { port: 4000 });

    var run = env.tasks.serve.run;
    var options = run.calledWith[0][1];

    assert.equal(run.called, 1, 'expected run to be called once');

    assert.equal(options.port,           4000,      'has correct port');
    assert.equal(options.liveReloadPort, 35529,     'has correct liveReload port');
  });
});
