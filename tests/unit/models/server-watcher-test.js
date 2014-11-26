'use strict';

var assert = require('assert');
var EOL = require('os').EOL;
var MockUI = require('../../helpers/mock-ui');
var MockAnalytics = require('../../helpers/mock-analytics');
var MockServerWatcher  = require('../../helpers/mock-watcher');
var ServerWatcher = require('../../../lib/models/server-watcher');

describe('Server Watcher', function() {
  var ui;
  var subject;
  var analytics;
  var watcher;

  beforeEach(function() {
    ui        = new MockUI();
    analytics = new MockAnalytics();
    watcher   = new MockServerWatcher();

    subject = new ServerWatcher({
      ui: ui,
      analytics: analytics,
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
    beforeEach(function () {
      watcher.emit('change', 'foo.txt');
    });

    it('logs that the file was changed', function() {
      assert.equal(ui.output, 'Server file changed: foo.txt' + EOL);
    });

    it('tracks changes', function() {
      assert.deepEqual(analytics.tracks, [{
        name: 'server file change',
        description: 'File changed: "foo.txt"'
      }]);
    });
  });

  describe('watcher:add', function() {
    beforeEach(function () {
      watcher.emit('add', 'foo.txt');
    });

    it('logs that the file was added', function() {
      assert.equal(ui.output, 'Server file added: foo.txt' + EOL);
    });

    it('tracks additions', function() {
      assert.deepEqual(analytics.tracks, [{
        name: 'server file addition',
        description: 'File added: "foo.txt"'
      }]);
    });
  });

  describe('watcher:delete', function() {
    beforeEach(function () {
      watcher.emit('delete', 'foo.txt');
    });

    it('logs that the file was deleted', function() {
      assert.equal(ui.output, 'Server file deleted: foo.txt' + EOL);
    });

    it('tracks deletions', function() {
      assert.deepEqual(analytics.tracks, [{
        name: 'server file deletion',
        description: 'File deleted: "foo.txt"'
      }]);
    });
  });
});
