'use strict';

var command;
var assert = require('../../helpers/assert');
var stub = require('../../helpers/stub').stub;
var env;

describe('server command', function() {
  var ui = {};

  before(function() {
    command = require('../../../lib/commands/serve');

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
    command.run(ui, env, { port: 4000 });

    var serveRun = env.tasks.serve.run;
    var options = serveRun.calledWith[0][1];

    assert.equal(serveRun.called, 1, 'expected run to be called once');

    assert.equal(options.port,           4000,      'has correct port');
    assert.equal(options.liveReloadPort, 35529,     'has correct liveReload port');
  });
});
