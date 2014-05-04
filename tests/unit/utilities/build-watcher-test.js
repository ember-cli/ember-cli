'use strict';

var rewire = require('rewire');
var assert = require('../../helpers/assert');
var MockUI = require('../../helpers/mock-ui');
var stub   = require('../../helpers/stub').stub;

var MockAnalytics = require('../../helpers/mock-analytics');

var called;
var analyticsCalled;
var utility;
var analytics;
var callbacks;
var buildBuilderCalled;

function stubWatcher() {
  return function watcher() {
    called = true;
    callbacks = {};
    stub(callbacks, 'on');

    return callbacks;
  };
}

function stubBuildBuilder() {
  return function buildBuilder() {
    buildBuilderCalled = true;
  };
}

describe('buildWatcher utility', function() {
  var ui;

  before(function() {
    utility = rewire('../../../lib/utilities/build-watcher');
    utility.__set__('Watcher', stubWatcher());
    utility.__set__('buildBuilder', stubBuildBuilder());
  });

  beforeEach(function() {
    ui        = new MockUI();
    analytics = new MockAnalytics();
  });

  afterEach(function() {
    called = false;
    buildBuilderCalled = false;
    analyticsCalled = false;
  });

  it('creates a Watcher instance', function() {
    utility();

    assert.ok(called);
  });

  it('sets up the proper callbacks', function() {
    utility();

    assert.equal(callbacks.on.calledWith[0][0], 'change');
    assert.equal(callbacks.on.calledWith[1][0], 'error');
  });

  it('the change callback does not print without an error first', function() {
    utility({ui: ui, analytics: analytics});

    callbacks.on.calledWith[0][1]({totalTime: 1});

    assert.equal(ui.output, '');
  });

  it('the change callback prints a message if there is an error', function() {
    utility({ui: ui, analytics: analytics});

    callbacks.on.calledWith[1][1](true);
    callbacks.on.calledWith[0][1]({totalTime: 1});

    assert.equal(ui.output, '\u001b[32m\n\nBuild successful.\n\u001b[39m');
  });

  it('the change callback prints a message only once if there is an error', function() {
    utility({ui: ui, analytics: analytics});

    callbacks.on.calledWith[1][1](true);
    callbacks.on.calledWith[0][1]({totalTime: 1});
    callbacks.on.calledWith[0][1]({totalTime: 1});

    assert.equal(ui.output, '\u001b[32m\n\nBuild successful.\n\u001b[39m');
  });

  it('will create a builder instance if not provided', function() {
    utility({ui: ui, analytics: analytics});

    assert.ok(buildBuilderCalled);
  });

  it('triggers events to be tracked', function() {
    var trackCalled, trackTimingCalled;

    analytics = {
      track: function() { trackCalled = true; },
      trackTiming: function() { trackTimingCalled = true; }
    };

    utility({ui: ui, analytics: analytics});
    callbacks.on.calledWith[0][1]({totalTime: 1233});

    assert.ok(trackCalled);
    assert.ok(trackTimingCalled);
  });

});

