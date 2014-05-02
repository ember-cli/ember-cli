'use strict';

var assert          = require('../../helpers/assert');
var stub            = require('../../helpers/stub').stub;
var MockUI          = require('../../helpers/mock-ui');
var MockAnalytics   = require('../../helpers/mock-analytics');
var Promise         = require('../../../lib/ext/promise');
var Task            = require('../../../lib/models/task');

var TestCommand = require('../../../lib/commands/test');

describe('test command', function() {
  var ui;
  var analytics;
  var tasks;

  beforeEach(function(){
    ui = new MockUI();
    analytics = new MockAnalytics();
  });

  before(function(){
    tasks = {
      Build: Task.extend({}),
      Test: Task.extend({})
    };

    stub(tasks.Test.prototype, 'run', Promise.resolve());
    stub(tasks.Build.prototype, 'run', Promise.resolve());
  });

  it('builds and runs test', function() {
    var buildRun = tasks.Build.prototype.run;
    var testRun = tasks.Test.prototype.run;

    new TestCommand({
      ui: ui,
      analytics: analytics,
      tasks: tasks,
      project: { isEmberCLIProject: function(){ return true; }}
    }).validateAndRun([]).then(function(){
      assert.equal(buildRun.called, 1, 'expected build task to be called once');
      assert.equal(testRun.called, 1, 'expected test task to be called once');
    });
  });

  it('has the correct options', function() {
    var buildRun = tasks.Build.prototype.run;
    var testRun = tasks.Test.prototype.run;

    new TestCommand({
      ui: ui,
      analytics: analytics,
      tasks: tasks,
      project: { isEmberCLIProject: function(){ return true; }}
    }).validateAndRun([]).then(function(){
        var buildOptions = buildRun.calledWith[0][0];
        var testOptions = testRun.calledWith[1][0];

        assert.equal(buildOptions.environment, 'development', 'has correct env');
        assert.ok(buildOptions.outputPath, 'has outputPath');
        assert.equal(testOptions.configFile, 'tests/testem.json', 'has config file');
      });
  });
});
