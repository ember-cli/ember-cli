'use strict';

var assert        = require('chai').assert;
var MockUI        = require('ember-cli/tests/helpers/mock-ui');
var MockAnalytics = require('ember-cli/tests/helpers/mock-analytics');
var Command       = require('ember-cli/lib/models/command');
var Task          = require('ember-cli/lib/models/task');
var RSVP          = require('rsvp');

var <%= classifiedCommandName %>CommandBase = require('../../../lib/commands/<%= commandName %>');

describe('<%= commandName %> command', function() {
  var ui;
  var tasks;
  var analytics;
  var project;
  var fakeSpawn;
  var CommandUnderTest;
  var buildTaskCalled;
  var buildTaskReceivedProject;

  before(function() {
    CommandUnderTest = Command.extend(<%= classifiedCommandName %>CommandBase);
  });

  beforeEach(function() {
    buildTaskCalled = false;
    ui = new MockUI();
    analytics = new MockAnalytics();
    tasks = {
      Build: Task.extend({
        run: function() {
          buildTaskCalled = true;
          buildTaskReceivedProject = !!this.project;

          return RSVP.resolve();
        }
      })
    };

    project = {
      isEmberCLIProject: function(){
        return true;
      }
    };
  });

  it('<%= commandName %> command smoke test', function() {
    return new CommandUnderTest({
      ui: ui,
      analytics: analytics,
      project: project,
      environment: { },
      tasks: tasks,
      settings: {},
      runCommand: function(command, args) {
        assert.deepEqual(args, []);
      }
    }).validateAndRun([]);
  });
});