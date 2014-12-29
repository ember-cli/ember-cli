'use strict';

var assert        = require('../../helpers/assert');
var MockUI        = require('../../helpers/mock-ui');
var MockAnalytics = require('../../helpers/mock-analytics');
var Task          = require('../../../lib/models/task');
var UpdateCommand = require('../../../lib/commands/update');
var UpdateChecker = require('../../../lib/models/update-checker');
var Promise       = require('../../../lib/ext/promise');

describe('update command', function() {
  var ui;
  var analytics;
  var project;
  var tasks;
  var updateTaskWasRun;

  beforeEach(function() {
    ui = new MockUI();
    updateTaskWasRun = false;
    analytics = new MockAnalytics();
    tasks = {
      Update: Task.extend({
        run: function() {
          updateTaskWasRun = true;
        }
      })
    };

    project = {
      isEmberCLIProject: function(){
        return true;
      }
    };
  });

  it('should contain `disableAnalytics` option', function() {
    var updateChecker = new UpdateChecker(ui, {
      checkForUpdates: true
    }, '100.0.0');

    updateChecker.checkNPM = function() {
      return Promise.resolve('0.0.1');
    };

    var updateCommand = new UpdateCommand({
      ui: ui,
      analytics: analytics,
      project: project,
      tasks: tasks,
      updateChecker: updateChecker,
      environment: { }
    });

    assert.equal(updateCommand.availableOptions.length, 1);
    assert.deepEqual(updateCommand.availableOptions[0], {
      key: 'disableAnalytics',
      type: Boolean,
      name: 'disable-analytics',
      required: false,
      default: false
    });
  });

  it('says \'you have the latest version\' if no update is needed', function() {
    var updateChecker = new UpdateChecker(ui, {
      checkForUpdates: true
    }, '100.0.0');

    updateChecker.checkNPM = function() {
      return Promise.resolve('0.0.1');
    };

    return new UpdateCommand({
      ui: ui,
      analytics: analytics,
      project: project,
      tasks: tasks,
      updateChecker: updateChecker,
      environment: { },
      settings: {}
    }).validateAndRun([]).then(function() {
      assert.include(ui.output, 'You have the latest version of ember-cli');
    });
  });

  it('calls UpdateTask if an update is needed', function() {
    var updateChecker = new UpdateChecker(ui, {
      checkForUpdates: true
    }, '0.0.1');

    updateChecker.checkNPM = function() {
      return Promise.resolve('100.0.0');
    };

    return new UpdateCommand({
      ui: ui,
      analytics: analytics,
      project: project,
      tasks: tasks,
      updateChecker: updateChecker,
      environment: { },
      settings: {}
    }).validateAndRun([]).then(function() {
      assert(updateTaskWasRun, 'update task should have been run');
    });
  });
});
