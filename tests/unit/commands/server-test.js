'use strict';

var assert             = require('../../helpers/assert');
var stub               = require('../../helpers/stub').stub;
var stubCommandOptions = require('../../helpers/stub').stubCommandOptions;
var Task               = require('../../../lib/models/task');
var ServeCommand;
var tasks;

describe('server command', function() {
  before(function() {
    ServeCommand = require('../../../lib/commands/serve');
    tasks = {
      Serve: Task.extend()
    };
  });

  beforeEach(function() {
    stub(tasks.Serve.prototype, 'run');
  });

  after(function() {
    ServeCommand = null;
  });

  afterEach(function() {
    tasks.Serve.prototype.run.restore();
  });

  it('has correct options', function() {
    new ServeCommand(
      stubCommandOptions(tasks)
    ).validateAndRun(['--port', '4000']);

    var serveRun = tasks.Serve.prototype.run;
    var options = serveRun.calledWith[0][0];

    assert.equal(serveRun.called, 1, 'expected run to be called once');

    assert.equal(options.port,           4000,      'has correct port');
    assert.equal(options.liveReloadPort, 35529,     'has correct liveReload port');
  });

  it('has correct proxy', function() {
    new ServeCommand(
      stubCommandOptions(tasks)
    ).validateAndRun(['--proxy', 'http://localhost:3000/']);

    var serveRun = tasks.Serve.prototype.run;
    var options = serveRun.calledWith[0][0];

    assert.equal(serveRun.called, 1, 'expected run to be called once');

    assert.equal(options.proxy, 'http://localhost:3000/', 'has correct port');
  });
});
