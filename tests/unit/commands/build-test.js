'use strict';

const { expect } = require('chai');
const commandOptions = require('../../factories/command-options');
const Task = require('../../../lib/models/task');
const BuildCommand = require('../../../lib/commands/build');
const td = require('testdouble');

describe('build command', function () {
  let tasks, options, command;
  let buildTaskInstance, buildWatchTaskInstance;

  beforeEach(function () {
    tasks = {
      Build: class extends Task {
        init() {
          super.init(...arguments);
          buildTaskInstance = this;
        }
      },

      BuildWatch: class extends Task {
        init() {
          super.init(...arguments);
          buildWatchTaskInstance = this;
        }
      },

      ShowAssetSizes: class extends Task {},
    };

    options = commandOptions({
      tasks,
    });

    command = new BuildCommand(options);

    td.replace(tasks.Build.prototype, 'run', td.function());
    td.replace(tasks.BuildWatch.prototype, 'run', td.function());
    td.replace(tasks.ShowAssetSizes.prototype, 'run', td.function());

    td.when(tasks.Build.prototype.run(), { ignoreExtraArgs: true, times: 1 }).thenResolve();
    td.when(tasks.BuildWatch.prototype.run(), { ignoreExtraArgs: true, times: 1 }).thenResolve();
  });

  afterEach(function () {
    td.reset();
  });

  it('Build task is provided with the project instance', function () {
    return command.validateAndRun([]).then(function () {
      expect(buildTaskInstance.project).to.equal(options.project, 'has correct project instance');
    });
  });

  it('BuildWatch task is provided with the project instance', function () {
    return command.validateAndRun(['--watch']).then(function () {
      expect(buildWatchTaskInstance.project).to.equal(options.project, 'has correct project instance');
    });
  });

  it('`--watch` throws in Vite-based projects', async function () {
    command.isViteProject = true;
    await expect(command.validateAndRun(['--watch'])).to.be.rejectedWith(
      'The `--watch` option to `ember build` is not supported in Vite-based projects. Please use `vite dev` instead.'
    );
  });

  it('`--watch` does not throw when EMBROIDER_PREBUILD is true', function () {
    // setup the scenario
    command.isViteProject = true;
    process.env.EMBROIDER_PREBUILD = 'true';

    return command
      .validateAndRun(['--watch'])
      .then(function () {
        expect(buildWatchTaskInstance.project).to.equal(options.project, 'has correct project instance');
      })
      .finally(() => {
        delete process.env.EMBROIDER_PREBUILD;
      });
  });

  it('`--watcher` throws in Vite-based projects', async function () {
    command.isViteProject = true;
    await expect(command.validateAndRun(['--watcher'])).to.be.rejectedWith(
      'The `--watcher` option to `ember build` is not supported in Vite-based projects. Please use `vite dev` instead.'
    );
  });

  it('BuildWatch task is provided with a watcher option', function () {
    return command.validateAndRun(['--watch', '--watcher poller']).then(function () {
      let buildWatchRun = tasks.BuildWatch.prototype.run;

      let captor = td.matchers.captor();
      td.verify(buildWatchRun(captor.capture()), { times: 1 });
      expect(captor.value.watcherPoller).to.equal(true, 'expected run to be called with a poller option');
    });
  });

  it('Asset Size Printer task is not run after Build task in non-production environment', function () {
    return new BuildCommand(options).validateAndRun([]).then(function () {
      let showSizesRun = tasks.ShowAssetSizes.prototype.run;

      td.verify(showSizesRun(), { ignoreExtraArgs: true, times: 0 });
    });
  });

  it('Asset Size Printer task is run after Build task in production environment', function () {
    return new BuildCommand(options).validateAndRun(['--environment=production']).then(function () {
      let showSizesRun = tasks.ShowAssetSizes.prototype.run;

      td.verify(showSizesRun(), { ignoreExtraArgs: true, times: 1 });
    });
  });

  it('Asset Size Printer task is not run if suppress sizes option is provided', function () {
    return new BuildCommand(options).validateAndRun(['--suppress-sizes']).then(function () {
      let showSizesRun = tasks.ShowAssetSizes.prototype.run;

      td.verify(showSizesRun(), { ignoreExtraArgs: true, times: 0 });
    });
  });
});
