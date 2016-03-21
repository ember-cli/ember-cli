'use strict';

var expect         = require('chai').expect;
var stub           = require('../../helpers/stub');
var commandOptions = require('../../factories/command-options');
var Promise        = require('../../../lib/ext/promise');
var Task           = require('../../../lib/models/task');
var BuildCommand   = require('../../../lib/commands/build');

var safeRestore = stub.safeRestore;
stub = stub.stub;

describe('build command', function() {
  var tasks, options, command;
  var buildTaskInstance, buildWatchTaskInstance;

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
      }),

      ShowAssetSizes: Task.extend({
        init: function() {}
      })
    };

    options = commandOptions({
      tasks: tasks
    });

    command = new BuildCommand(options);

    stub(tasks.Build.prototype, 'run', Promise.resolve());
    stub(tasks.BuildWatch.prototype, 'run', Promise.resolve());
    stub(tasks.ShowAssetSizes.prototype, 'run', Promise.resolve());
  });

  afterEach(function() {
    safeRestore(tasks.Build.prototype, 'run');
    safeRestore(tasks.BuildWatch.prototype, 'run');
    safeRestore(tasks.ShowAssetSizes.prototype, 'run');
  });

  it('Build task is provided with the project instance', function() {
    return command.validateAndRun([]).then(function() {
      var buildRun = tasks.Build.prototype.run;

      expect(buildRun.called).to.equal(1, 'expected run to be called once');
      expect(buildTaskInstance.project).to.equal(options.project, 'has correct project instance');
    });
  });

  it('BuildWatch task is provided with the project instance', function() {
    return command.validateAndRun(['--watch']).then(function() {
      var buildWatchRun = tasks.BuildWatch.prototype.run;

      expect(buildWatchRun.called).to.equal(1, 'expected run to be called once');
      expect(buildWatchTaskInstance.project).to.equal(options.project, 'has correct project instance');
    });
  });

  it('BuildWatch task is provided with a watcher option', function() {
    return command.validateAndRun(['--watch', '--watcher poller']).then(function() {
      var buildWatchRun = tasks.BuildWatch.prototype.run,
          calledWith = buildWatchRun.calledWith[0]['0'];

      expect(buildWatchRun.called).to.equal(1, 'expected run to be called once');
      expect(calledWith.watcherPoller).to.equal(true, 'expected run to be called with a poller option');
    });
  });

  it('Asset Size Printer task is not run after Build task in non-production environment', function () {
    return new BuildCommand(options).validateAndRun([ ]).then(function () {
      var buildRun = tasks.Build.prototype.run;
      var showSizesRun = tasks.ShowAssetSizes.prototype.run;

      expect(buildRun.called).to.equal(1, 'expected build run to be called once');
      expect(showSizesRun.called).to.equal(0, 'expected asset-sizes run to not be called');
    });
  });

  it('Asset Size Printer task is run after Build task in production environment', function () {
    return new BuildCommand(options).validateAndRun([ '--environment=production' ]).then(function () {
      var buildRun = tasks.Build.prototype.run;
      var showSizesRun = tasks.ShowAssetSizes.prototype.run;

      expect(buildRun.called).to.equal(1, 'expected build run to be called once');
      expect(showSizesRun.called).to.equal(1, 'expected asset-sizes run to be called once');
    });
  });

  it('Asset Size Printer task is not run if suppress sizes option is provided', function () {
    return new BuildCommand(options).validateAndRun([ '--suppress-sizes' ]).then(function () {
      var buildRun = tasks.Build.prototype.run;
      var showSizesRun = tasks.ShowAssetSizes.prototype.run;

      expect(buildRun.called).to.equal(1, 'expected build run to be called once');
      expect(showSizesRun.called).to.equal(0, 'expected asset-sizes run to not be called');
    });
  });
});
