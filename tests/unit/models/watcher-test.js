'use strict';

var assert = require('assert');

var MockUI = require('../../helpers/mock-ui');
var MockAnalytics = require('../../helpers/mock-analytics');
var MockWatcher  = require('../../helpers/mock-watcher');
var Watcher = require('../../../lib/models/watcher');

describe('Watcher', function() {
  var ui;
  var subject;
  var builder;
  var analytics;
  var watcher;

  beforeEach(function() {
    ui        = new MockUI();
    analytics = new MockAnalytics();
    watcher   = new MockWatcher();

    subject = new Watcher({
      ui: ui,
      analytics: analytics,
      builder: builder,
      watcher: watcher
    });
  });

  describe('watcher strategy selection', function() {
    it('selects the events-based watcher by default', function () {
      subject.options = null;
      assert.ok(!subject.polling());
    });

    it('selects the events-based watcher when given events watcher option', function () {
      subject.options = { watcher: 'events' };
      assert.ok(!subject.polling());
    });

    it('selects the polling watcher when given polling watcher option', function () {
      subject.options = { watcher: 'polling' };
      assert.ok(subject.polling());
    });
  });

  describe('watcher:change', function() {
    beforeEach(function() {
      watcher.emit('change', {
        totalTime: 12344000000
      });
    });

    it('tracks events', function() {
      assert.deepEqual(analytics.tracks, [{
        name: 'ember rebuild',
        message: 'broccoli rebuild time: 12344ms'
      }]);
    });

    it('tracks timings', function() {
      assert.deepEqual(analytics.trackTimings, [{
        category: 'rebuild',
        variable: 'rebuild time',
        label:    'broccoli rebuild time',
        value:    12344
      }]);
    });

    it('logs that the build was successful', function() {
      assert.equal(ui.output, '\u001b[32m\nBuild successful - 12344ms.\n\u001b[39m');
    });
  });

  describe('watcher:error', function() {
    beforeEach(function() {
      watcher.emit('error', {
        message: 'foo',
        stack: new Error().stack
      });
    });

    it('tracks errors', function() {
      assert.deepEqual(analytics.trackErrors, [{
        description: 'foo'
      }]);
    });
  });

  describe('watcher:change afterError', function() {
    beforeEach(function() {
      watcher.emit('error', {
        message: 'foo',
        stack: new Error().stack
      });

      watcher.emit('change', {
        totalTime: 12344000000
      });
    });

    it('log that the build was green', function() {
      assert(/Build successful./.test(ui.output), 'has successful build output');
    });

    it('keep tracking analytics', function() {
      assert.deepEqual(analytics.tracks, [{
        name: 'ember rebuild',
        message: 'broccoli rebuild time: 12344ms'
      }]);
    });
  });
});
