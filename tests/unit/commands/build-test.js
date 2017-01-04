'use strict';

const expect = require('chai').expect;
const commandOptions = require('../../factories/command-options');
const Promise = require('../../../lib/ext/promise');
const Task = require('../../../lib/models/task');
const BuildCommand = require('../../../lib/commands/build');
const td = require('testdouble');

describe('build command', function() {
  let tasks, options, command;
  let buildTaskInstance, buildWatchTaskInstance;

  beforeEach(function() {
    tasks = {
      Build: Task.extend({
        init() {
          this._super.init && this._super.init.apply(this, arguments);
          buildTaskInstance = this;
        },
      }),

      BuildWatch: Task.extend({
        init() {
          this._super.init && this._super.init.apply(this, arguments);
          buildWatchTaskInstance = this;
        },
      }),

      ShowAssetSizes: Task.extend({
        init() {
          this._super.init && this._super.init.apply(this, arguments);
        },
      }),
    };

    options = commandOptions({
      tasks,
    });

    command = new BuildCommand(options);

    td.replace(tasks.Build.prototype, 'run', td.function());
    td.replace(tasks.BuildWatch.prototype, 'run', td.function());
    td.replace(tasks.ShowAssetSizes.prototype, 'run', td.function());

    td.when(tasks.Build.prototype.run(), { ignoreExtraArgs: true, times: 1 }).thenReturn(Promise.resolve());
    td.when(tasks.BuildWatch.prototype.run(), { ignoreExtraArgs: true, times: 1 }).thenReturn(Promise.resolve());
  });

  afterEach(function() {
    td.reset();
  });

  it('Build task is provided with the project instance', function() {
    return command.validateAndRun([]).then(function() {
      let buildRun = tasks.Build.prototype.run;

      expect(buildTaskInstance.project).to.equal(options.project, 'has correct project instance');
    });
  });

  it('BuildWatch task is provided with the project instance', function() {
    return command.validateAndRun(['--watch']).then(function() {
      let buildWatchRun = tasks.BuildWatch.prototype.run;

      expect(buildWatchTaskInstance.project).to.equal(options.project, 'has correct project instance');
    });
  });

  it('BuildWatch task is provided with a watcher option', function() {
    return command.validateAndRun(['--watch', '--watcher poller']).then(function() {
      let buildWatchRun = tasks.BuildWatch.prototype.run;

      let captor = td.matchers.captor();
      td.verify(buildWatchRun(captor.capture()), { times: 1 });
      expect(captor.value.watcherPoller).to.equal(true, 'expected run to be called with a poller option');
    });
  });

  it('Asset Size Printer task is not run after Build task in non-production environment', function() {
    return new BuildCommand(options).validateAndRun([]).then(function() {
      let buildRun = tasks.Build.prototype.run;
      let showSizesRun = tasks.ShowAssetSizes.prototype.run;

      td.verify(showSizesRun(), { ignoreExtraArgs: true, times: 0 });
    });
  });

  it('Asset Size Printer task is run after Build task in production environment', function() {
    return new BuildCommand(options).validateAndRun(['--environment=production']).then(function() {
      let buildRun = tasks.Build.prototype.run;
      let showSizesRun = tasks.ShowAssetSizes.prototype.run;

      td.verify(showSizesRun(), { ignoreExtraArgs: true, times: 1 });
    });
  });

  it('Asset Size Printer task is not run if suppress sizes option is provided', function() {
    return new BuildCommand(options).validateAndRun(['--suppress-sizes']).then(function() {
      let buildRun = tasks.Build.prototype.run;
      let showSizesRun = tasks.ShowAssetSizes.prototype.run;

      td.verify(showSizesRun(), { ignoreExtraArgs: true, times: 0 });
    });
  });
});
