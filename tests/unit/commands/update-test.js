'use strict';

var assert        = require('../../helpers/assert');
var MockUI        = require('../../helpers/mock-ui');
var MockAnalytics = require('../../helpers/mock-analytics');
var rewire        = require('rewire');
var Promise       = require('../../../lib/ext/promise');
var Task          = require('../../../lib/models/task');

describe('update command', function() {
  var UpdateCommand;
  var ui;
  var analytics;
  var project;
  var tasks;

  beforeEach(function() {
    ui = new MockUI();
    analytics = new MockAnalytics();
    tasks = {
      Update: Task.extend({
        run: function() {
          this.ui.write('UpdateTask called successfully');
        }
      })
    };
    project = { isEmberCLIProject: function(){ return true; }};
    UpdateCommand = rewire('../../../lib/commands/update');
  });


  it('says "you have the latest version" if no update is needed', function() {
    UpdateCommand.__set__('checkForUpdates', function() {
      return new Promise(function(resolve) {
        resolve({ updateNeeded: false });
      });
    });

    UpdateCommand.__set__('emberCLIVersion', function() {
      return '100.0.0';
    });

    return new UpdateCommand({
      ui: ui,
      analytics: analytics,
      project: project,
      tasks: tasks
    }).validateAndRun([]).catch(function() {
      assert.include(ui.output, 'You have the latest version of ember-cli');
    });
  });


  it('calls UpdateTask if an update is needed', function() {
    UpdateCommand.__set__('checkForUpdates', function() {
      return new Promise(function(resolve) {
        resolve({ updateNeeded: true, newestVersion: '100.0.0' });
      });
    });

    UpdateCommand.__set__('emberCLIVersion', function() {
      return '0.0.1';
    });

    return new UpdateCommand({
      ui: ui,
      analytics: analytics,
      project: project,
      tasks: tasks
    }).validateAndRun([]).then(function() {
      assert.include(ui.output, 'UpdateTask called successfully');
    });
  });

});
