'use strict';

const RSVP = require('rsvp');
const ServeTask = require('../../../lib/tasks/serve');
const Builder = require('../../../lib/models/builder');
const MockProject = require('../../helpers/mock-project');
const expect = require('chai').expect;

const Promise = RSVP.Promise;

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

  function runServeTask() {
    let project = new MockProject();

    ui = project.ui;
    let _builder = new Builder({
      ui,
      project,
      setupBroccoliBuilder,
      onProcessInterrupt: {
        addHandler() { return function() { }; },
      },
    });

    let _watcher = {};
    let _expressServer = {
      start() { return Promise.resolve(); },
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
    };
    return task.run(options);
  }

  describe('onInterrupt', function() {
    it('fulfills the run promise and cleans up the builder', function() {
      let servePromise = runServeTask();

      RSVP.resolve().then(() => task.onInterrupt());

      return servePromise.then(() => {
        expect(ui.output).to.include('cleaning up...');
      });
    });
  });
});
