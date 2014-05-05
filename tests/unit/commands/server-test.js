'use strict';

var assert        = require('../../helpers/assert');
var stub          = require('../../helpers/stub').stub;
var MockUI        = require('../../helpers/mock-ui');
var MockAnalytics = require('../../helpers/mock-analytics');
var Task          = require('../../../lib/models/task');
var ServeCommand;
var tasks;

describe('server command', function() {
  var ui;
  var analytics;

  before(function() {
    ServeCommand = require('../../../lib/commands/serve');
    ui = new MockUI();
    analytics = new MockAnalytics();
    tasks = {
      Serve: Task.extend({})
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
    new ServeCommand({
      ui: ui,
      analytics: analytics,
      tasks: tasks,
      project: { isEmberCLIProject: function(){ return true; }}
    }).validateAndRun(['--port', '4000']);

    var serveRun = tasks.Serve.prototype.run;
    var options = serveRun.calledWith[0][0];

    assert.equal(serveRun.called, 1, 'expected run to be called once');

    assert.equal(options.port,           4000,      'has correct port');
    assert.equal(options.liveReloadPort, 35529,     'has correct liveReload port');
  });

  it('has correct proxy', function() {
    new ServeCommand({
      ui: ui,
      analytics: analytics,
      tasks: tasks,
      project: { isEmberCLIProject: function(){ return true; }}
    }).validateAndRun(['--proxy', 'http://localhost:3000/']);

    var serveRun = tasks.Serve.prototype.run;
    var options = serveRun.calledWith[0][0];

    assert.equal(serveRun.called, 1, 'expected run to be called once');

    assert.equal(options.proxy, 'http://localhost:3000/', 'has correct port');
  });
});
