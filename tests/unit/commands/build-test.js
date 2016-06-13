'use strict';

var expect         = require('chai').expect;
var commandOptions = require('../../factories/command-options');
var Promise        = require('../../../lib/ext/promise');
var Task           = require('../../../lib/models/task');
var BuildCommand   = require('../../../lib/commands/build');
var td = require('testdouble');

describe('build command', function() {
  var tasks, options, command;
  var buildTaskInstance, buildWatchTaskInstance;

  beforeEach(function() {
    tasks = {
      Build: Task.extend({
        init: function() {
          this._super.apply(this, arguments);
          buildTaskInstance = this;
        }
      }),

      BuildWatch: Task.extend({
        init: function() {
          this._super.apply(this, arguments);
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

    td.replace(tasks.Build.prototype, 'run', td.function());
    td.replace(tasks.BuildWatch.prototype, 'run', td.function());
    td.replace(tasks.ShowAssetSizes.prototype, 'run', td.function());

    td.when(tasks.Build.prototype.run(), {ignoreExtraArgs: true}).thenReturn(Promise.resolve());
    td.when(tasks.BuildWatch.prototype.run(), {ignoreExtraArgs: true}).thenReturn(Promise.resolve());
    td.when(tasks.ShowAssetSizes.prototype.run(), {ignoreExtraArgs: true}).thenReturn(Promise.resolve());
  });

  afterEach(function() {
    td.reset();
  });

  it('Build task is provided with the project instance', function() {
    return command.validateAndRun([]).then(function() {
      var buildRun = tasks.Build.prototype.run;

      td.verify(buildRun(), {ignoreExtraArgs: true, times: 1});
      expect(buildTaskInstance.project).to.equal(options.project, 'has correct project instance');
    });
  });

  it('BuildWatch task is provided with the project instance', function() {
    return command.validateAndRun(['--watch']).then(function() {
      var buildWatchRun = tasks.BuildWatch.prototype.run;

      td.verify(buildWatchRun(), {ignoreExtraArgs: true, times: 1});
      expect(buildWatchTaskInstance.project).to.equal(options.project, 'has correct project instance');
    });
  });

  it('BuildWatch task is provided with a watcher option', function() {
    return command.validateAndRun(['--watch', '--watcher poller']).then(function() {
      var buildWatchRun = tasks.BuildWatch.prototype.run;

      var captor = td.matchers.captor();
      td.verify(buildWatchRun(captor.capture()), {times: 1});
      expect(captor.value.watcherPoller).to.equal(true, 'expected run to be called with a poller option');
    });
  });

  it('Asset Size Printer task is not run after Build task in non-production environment', function () {
    return new BuildCommand(options).validateAndRun([ ]).then(function () {
      var buildRun = tasks.Build.prototype.run;
      var showSizesRun = tasks.ShowAssetSizes.prototype.run;

      td.verify(buildRun(), {ignoreExtraArgs: true, times: 1});
      td.verify(showSizesRun(), {ignoreExtraArgs: true, times: 0});
    });
  });

  it('Asset Size Printer task is run after Build task in production environment', function () {
    return new BuildCommand(options).validateAndRun([ '--environment=production' ]).then(function () {
      var buildRun = tasks.Build.prototype.run;
      var showSizesRun = tasks.ShowAssetSizes.prototype.run;

      td.verify(buildRun(), {ignoreExtraArgs: true, times: 1});
      td.verify(showSizesRun(), {ignoreExtraArgs: true, times: 1});
    });
  });

  it('Asset Size Printer task is not run if suppress sizes option is provided', function () {
    return new BuildCommand(options).validateAndRun([ '--suppress-sizes' ]).then(function () {
      var buildRun = tasks.Build.prototype.run;
      var showSizesRun = tasks.ShowAssetSizes.prototype.run;

      td.verify(buildRun(), {ignoreExtraArgs: true, times: 1});
      td.verify(showSizesRun(), {ignoreExtraArgs: true, times: 0});
    });
  });
});
