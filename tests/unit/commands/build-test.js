'use strict';

var expect         = require('chai').expect;
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
    return new BuildCommand(options).validateAndRun([ ]).then(function() {
      var buildRun = tasks.Build.prototype.run;

      expect(buildRun.called).to.equal(1, 'expected run to be called once');
      expect(buildTaskInstance.project).to.equal(options.project, 'has correct project instance');
    });
  });

  it('BuildWatch task is provided with the project instance', function() {
    return new BuildCommand(options).validateAndRun([ '--watch' ]).then(function() {
      var buildWatchRun = tasks.BuildWatch.prototype.run;

      expect(buildWatchRun.called).to.equal(1, 'expected run to be called once');
      expect(buildWatchTaskInstance.project).to.equal(options.project, 'has correct project instance');
    });
  });

  it('BuildWatch task is provided with a watcher option', function() {
    return new BuildCommand(options).validateAndRun([ '--watch', '--watcher poller' ]).then(function() {
      var buildWatchRun = tasks.BuildWatch.prototype.run,
        calledWith = buildWatchRun.calledWith[0]['0'];

      expect(buildWatchRun.called).to.equal(1, 'expected run to be called once');
      expect(calledWith.watcherPoller).to.equal(true, 'expected run to be called with a poller option');

    });
  });
});
