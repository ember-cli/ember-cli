'use strict';

var assert         = require('../../helpers/assert');
var stub           = require('../../helpers/stub').stub;
var commandOptions = require('../../factories/command-options');
var Task           = require('../../../lib/models/task');

describe('server command', function() {
  var ServeCommand;
  var tasks;
  var options;

  before(function() {
    ServeCommand = require('../../../lib/commands/serve');
  });

  beforeEach(function() {
    tasks = {
      Serve: Task.extend()
    };

    options = commandOptions({
      tasks: tasks,
      settings: {}
    });

    stub(tasks.Serve.prototype, 'run');
  });

  after(function() {
    ServeCommand = null;
  });

  afterEach(function() {
    tasks.Serve.prototype.run.restore();
  });

  it('has correct options', function() {
    new ServeCommand(options).validateAndRun([
      '--port', '4000'
    ]);

    var serveRun = tasks.Serve.prototype.run;
    var ops = serveRun.calledWith[0][0];

    assert.equal(serveRun.called, 1, 'expected run to be called once');

    assert.equal(ops.port,           4000,      'has correct port');
    assert.equal(ops.liveReloadPort, 35529,     'has correct liveReload port');
  });

  it('has correct liveLoadPort', function() {
    new ServeCommand(options).validateAndRun([
      '--live-reload-port', '4001'
    ]);

    var serveRun = tasks.Serve.prototype.run;
    var ops = serveRun.calledWith[0][0];

    assert.equal(serveRun.called, 1, 'expected run to be called once');

    assert.equal(ops.liveReloadPort, 4001,     'has correct liveReload port');
  });
  
  it('has correct proxy', function() {
    new ServeCommand(options).validateAndRun([
      '--proxy', 'http://localhost:3000/'
    ]);

    var serveRun = tasks.Serve.prototype.run;
    var ops = serveRun.calledWith[0][0];

    assert.equal(serveRun.called, 1, 'expected run to be called once');

    assert.equal(ops.proxy, 'http://localhost:3000/', 'has correct port');
  });
});
