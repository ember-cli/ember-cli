'use strict';

const RSVP = require('rsvp');
const BuildWatchTask = require('../../../lib/tasks/build-watch');
const Builder = require('../../../lib/models/builder');
const MockProject = require('../../helpers/mock-project');
const expect = require('chai').expect;

const Promise = RSVP.Promise;

describe('build-watch task', function() {
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

  function runBuildWatchTask() {
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

    let _watcher = {
      then(fulfillmentHandler, rejectionHandler) {
        return Promise.resolve().then(fulfillmentHandler, rejectionHandler);
      },
    };

    task = new BuildWatchTask({
      ui,
      project,
    });

    let options = {
      outputPath: 'tmp/build-watch-task-test',
      environment: 'test',
      _builder,
      _watcher,
    };
    return task.run(options);
  }

  describe('onInterrupt', function() {
    it('fulfills the run promise and cleans up the builder', function() {
      let runPromise = runBuildWatchTask();

      RSVP.resolve().then(() => task.onInterrupt());

      return runPromise.then(() => {
        expect(ui.output).to.include('cleaning up...');
        expect(ui.output).to.include('Environment: test');
      });
    });
  });
});

