'use strict';

var Task          = require('../../../lib/models/task');
var MockUI        = require('../../helpers/mock-ui');
var MockAnalytics = require('../../helpers/mock-analytics');
var assert        = require('assert');

var FakeTask = Task.extend({
  run: function(commandOptions /*, rawArgs*/) {
    this._track(commandOptions, {
      name: 'foo',
      message: 'bar'
    });
  }
});

describe('models/task.js', function() {
  var ui;
  var analytics;
  var project;

  before(function() {
    ui = new MockUI();
    analytics = new MockAnalytics();
    project = { isEmberCLIProject: function(){ return true; }};
  });

  it('should call track functions by default', function() {
    var l = analytics.tracks.length;

    var task = new FakeTask({
      ui: ui,
      project: project,
      analytics: analytics
    });

    task.run({
      disableAnalytics: false
    });

    assert.equal(l + 1, analytics.tracks.length);
  });
  it('should not call track functions if --disable-analytics=true', function() {
    var l = analytics.tracks.length;

    var task = new FakeTask({
      ui: ui,
      project: project,
      analytics: analytics
    });

    task.run({
      disableAnalytics: true
    });

    assert.equal(l, analytics.tracks.length);
  });
});
