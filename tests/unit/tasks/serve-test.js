'use strict';

const ServeTask = require('../../../lib/tasks/serve');
const Builder = require('../../../lib/models/builder');
const MockProject = require('../../helpers/mock-project');
const expect = require('chai').expect;

describe('serve task', function() {
  let task, ui;

  function setupBroccoliBuilder() {
    this.builder = {
      build() {
        return Promise.resolve('build results');
      },

      cleanup() {
        return Promise.resolve('cleanup result');
      },

      processBuildResult(results) {
        return Promise.resolve(results);
      },
    };
  }

  function runServeTask(path) {
    let project = new MockProject();

    ui = project.ui;
    let _builder = new Builder({
      ui,
      project,
      setupBroccoliBuilder,
      onProcessInterrupt: {
        addHandler() {},
        removeHandler() {},
      },
    });

    let _watcher = {};
    let _expressServer = {
      start() {
        return Promise.resolve();
      },
    };
    let _liveReloadServer = _expressServer;

    task = new ServeTask({
      ui,
      project,
    });

    let options = {
      outputPath: 'tmp/serve-task-test',
      environment: 'test',
      _builder,
      _watcher,
      _expressServer,
      _liveReloadServer,
      path,
    };
    return task.run(options);
  }

  describe('run with path', function() {
    it(`Throws error if path doesn't exist`, function() {
      expect(runServeTask.bind(this, 'xyz')).to.throw(
        'The path xyz does not exist. Please specify a valid build directory to serve.'
      );
    });

    it(`Serves ember app from given path`, async function() {
      runServeTask('docs');

      await Promise.resolve();
      expect(ui.output).to.be.contains('– Serving on');
    });
  });

  describe('onInterrupt', function() {
    it('fulfills the run promise and cleans up the builder', async function() {
      let servePromise = runServeTask();

      await Promise.resolve();
      task.onInterrupt();

      await servePromise;
      expect(ui.output).to.include('cleaning up...');
    });
  });
});
