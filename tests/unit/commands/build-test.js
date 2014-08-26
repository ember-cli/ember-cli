'use strict';

var assert         = require('../../helpers/assert');
var stub           = require('../../helpers/stub').stub;
var commandOptions = require('../../factories/command-options');
var Task           = require('../../../lib/models/task');

describe('build command', function() {
  var BuildCommand;
  var tasks, buildTaskInstance, buildWatchTaskInstance;
  var options;

  before(function() {
    BuildCommand = require('../../../lib/commands/build');
  });

  beforeEach(function() {
    tasks = {
      Build: Task.extend({
        init: function() {
          buildTaskInstance = this;
        }
      }),

      BuildWatch: Task.extend({
        init: function() {
          buildWatchTaskInstance = this;
        }
      })
    };

    options = commandOptions({
      tasks: tasks,
      settings: {}
    });

    stub(tasks.Build.prototype, 'run');
    stub(tasks.BuildWatch.prototype, 'run');
  });

  after(function() {
    BuildCommand = null;
    buildWatchTaskInstance = null;
    buildTaskInstance = null;
  });

  afterEach(function() {
    tasks.Build.prototype.run.restore();
    tasks.BuildWatch.prototype.run.restore();
  });

  it('Build task is provided with the project instance', function() {
    new BuildCommand(options).validateAndRun([ ]);

    var buildRun = tasks.Build.prototype.run;

    assert.equal(buildRun.called, 1, 'expected run to be called once');
    assert.equal(buildTaskInstance.project, options.project, 'has correct project instance');
  });

  it('BuildWatch task is provided with the project instance', function() {
    new BuildCommand(options).validateAndRun([ '--watch' ]);

    var buildWatchRun = tasks.BuildWatch.prototype.run;

    assert.equal(buildWatchRun.called, 1, 'expected run to be called once');
    assert.equal(buildWatchTaskInstance.project, options.project, 'has correct project instance');
  });
});
