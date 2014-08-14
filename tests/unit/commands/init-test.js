'use strict';

var path          = require('path');
var assert        = require('../../helpers/assert');
var MockUI        = require('../../helpers/mock-ui');
var MockAnalytics = require('../../helpers/mock-analytics');
var Promise       = require('../../../lib/ext/promise');
var Project       = require('../../../lib/models/project');
var Task          = require('../../../lib/models/task');

describe('init command', function() {
  var InitCommand;
  var ui;
  var analytics;
  var project;
  var tasks;

  beforeEach(function() {
    ui = new MockUI();
    analytics = new MockAnalytics();
    tasks = {
      InstallBlueprint: Task.extend({}),
      NpmInstall: Task.extend({}),
      BowerInstall: Task.extend({})
    };

    project = new Project(process.cwd(), { name: 'some-random-name'});
    InitCommand = require('../../../lib/commands/init');
  });

  it('doesn\'t allow to create an application named `test`', function() {
    var command = new InitCommand({
      ui: ui,
      analytics: analytics,
      project: new Project(process.cwd(), { name: 'test'}),
      tasks: tasks,
      settings: {}
    });

    return command.validateAndRun([]).then(function() {
      assert.ok(false, 'should have rejected with an application name of test');
    })
    .catch(function(error) {
      assert.equal(error.message, 'We currently do not support a name of `test`.\n');
    });
  });

  it('Uses the name of the closest project to when calling installBlueprint', function() {
    tasks.InstallBlueprint = Task.extend({
      run: function(blueprintOpts) {
        assert.equal(blueprintOpts.rawName, 'some-random-name');
        return Promise.reject('Called run');
      }
    });

    var command = new InitCommand({
      ui: ui,
      analytics: analytics,
      project: project,
      tasks: tasks,
      settings: {}
    });

    return command.validateAndRun([])
      .catch(function(reason) {
        assert.equal(reason, 'Called run');
      });
  });

  it('Uses the provided app name over the closest found project', function() {
    tasks.InstallBlueprint = Task.extend({
      run: function(blueprintOpts) {
        assert.equal(blueprintOpts.rawName, 'provided-name');
        return Promise.reject('Called run');
      }
    });

    var command = new InitCommand({
      ui: ui,
      analytics: analytics,
      project: new Project(process.cwd(), { name: 'some-random-name'}),
      tasks: tasks,
      settings: {}
    });

    return command.validateAndRun(['provided-name'])
      .catch(function(reason) {
        assert.equal(reason, 'Called run');
      });
  });


  it('Uses process.cwd if no package is found when calling installBlueprint', function() {
    tasks.InstallBlueprint = Task.extend({
      run: function(blueprintOpts) {
        assert.equal(blueprintOpts.rawName, path.basename(process.cwd()));
        return Promise.reject('Called run');
      }
    });
    var command = new InitCommand({
      ui: ui,
      analytics: analytics,
      project: new Project(process.cwd(), { name: path.basename(process.cwd()) }),
      tasks: tasks,
      settings: {}
    });

    return command.validateAndRun([])
      .catch(function(reason) {
        assert.equal(reason, 'Called run');
      });
  });

  it('doesn\'t use --dry-run or any other command option as the name', function() {
    tasks.InstallBlueprint = Task.extend({
      run: function(blueprintOpts) {
        assert.equal(blueprintOpts.rawName, 'some-random-name');
        return Promise.reject('Called run');
      }
    });

    var command = new InitCommand({
      ui: ui,
      analytics: analytics,
      project: new Project(process.cwd(), { name: 'some-random-name'}),
      tasks: tasks,
      settings: {}
    });

    return command.validateAndRun(['--dry-run'])
      .catch(function(reason) {
        assert.equal(reason, 'Called run');
      });
  });

  it('doesn\'t use . as the name', function() {
    tasks.InstallBlueprint = Task.extend({
      run: function(blueprintOpts) {
        assert.equal(blueprintOpts.rawName, 'some-random-name');
        return Promise.reject('Called run');
      }
    });

    var command = new InitCommand({
      ui: ui,
      analytics: analytics,
      project: new Project(process.cwd(), { name: 'some-random-name'}),
      tasks: tasks,
      settings: {}
    });

    return command.validateAndRun(['.'])
      .catch(function(reason) {
        assert.equal(reason, 'Called run');
      });
  });

  it('Uses the "app" blueprint by default', function() {
    tasks.InstallBlueprint = Task.extend({
      run: function(blueprintOpts) {
        assert.equal(blueprintOpts.blueprint, 'app');
        return Promise.reject('Called run');
      }
    });

    var command = new InitCommand({
      ui: ui,
      analytics: analytics,
      project: new Project(process.cwd(), { name: 'some-random-name'}),
      tasks: tasks,
      settings: {}
    });

    return command.validateAndRun(['provided-name'])
      .catch(function(reason) {
        assert.equal(reason, 'Called run');
      });
  });

  it('Uses the "addon" blueprint for addons', function() {
    tasks.InstallBlueprint = Task.extend({
      run: function(blueprintOpts) {
        assert.equal(blueprintOpts.blueprint, 'addon');
        return Promise.reject('Called run');
      }
    });

    var command = new InitCommand({
      ui: ui,
      analytics: analytics,
      project: new Project(process.cwd(), { keywords: [ 'ember-addon' ], name: 'some-random-name'}),
      tasks: tasks,
      settings: {}
    });

    return command.validateAndRun(['provided-name'])
      .catch(function(reason) {
        assert.equal(reason, 'Called run');
      });
  });
});
