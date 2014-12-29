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

  it('should contain `disableAnalytics` option', function() {
    var serveCommand = new ServeCommand(options);

    assert.equal(serveCommand.availableOptions.length, 9);
    assert.deepEqual(serveCommand.availableOptions[8], {
      key: 'disableAnalytics',
      type: Boolean,
      name: 'disable-analytics',
      required: false,
      default: false
    });
  });

  it('has correct options', function() {
    return new ServeCommand(options).validateAndRun([
      '--port', '4000'
    ]).then(function() {
      var serveRun = tasks.Serve.prototype.run;
      var ops = serveRun.calledWith[0][0];

      assert.equal(serveRun.called, 1, 'expected run to be called once');

      assert.equal(ops.port,           4000,      'has correct port');
      assert.equal(ops.liveReloadPort, 35529,     'has correct liveReload port');
    });
  });

  it('has correct liveLoadPort', function() {
    return new ServeCommand(options).validateAndRun([
      '--live-reload-port', '4001'
    ]).then(function() {
      var serveRun = tasks.Serve.prototype.run;
      var ops = serveRun.calledWith[0][0];

      assert.equal(serveRun.called, 1, 'expected run to be called once');

      assert.equal(ops.liveReloadPort, 4001,     'has correct liveReload port');
    });
  });

  it('has correct proxy', function() {
    return new ServeCommand(options).validateAndRun([
      '--proxy', 'http://localhost:3000/'
    ]).then(function() {
      var serveRun = tasks.Serve.prototype.run;
      var ops = serveRun.calledWith[0][0];

      assert.equal(serveRun.called, 1, 'expected run to be called once');

      assert.equal(ops.proxy, 'http://localhost:3000/', 'has correct port');
    });
  });

  it('requires proxy URL to include protocol', function() {
    return new ServeCommand(options).validateAndRun([
      '--proxy', 'localhost:3000'
    ]).then(function() {
      assert.ok(
        false,
        'it rejects when proxy URL doesn\'t include protocol'
      );
    })
    .catch(function(error) {
      assert.equal(
        error.message,
        'You need to include a protocol with the proxy URL.\nTry --proxy http://localhost:3000'
      );
    });
  });

  it('uses baseURL of correct environment', function() {
    options.project.config = function(env) {
      return { baseURL: env };
    };

    return new ServeCommand(options).validateAndRun([
      '--environment', 'test'
    ]).then(function() {
      var serveRun = tasks.Serve.prototype.run;
      var ops = serveRun.calledWith[0][0];

      assert.equal(ops.baseURL, 'test', 'Uses the correct environment.');
    });
  });
});
