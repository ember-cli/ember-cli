'use strict';

const expect = require('chai').expect;
const EOL = require('os').EOL;
const MockUI = require('console-ui/mock');
const MockAnalytics = require('../../helpers/mock-analytics');
const MockServerWatcher = require('../../helpers/mock-watcher');
const ServerWatcher = require('../../../lib/models/server-watcher');

describe('Server Watcher', function () {
  let ui;
  let analytics;
  let watcher;

  beforeEach(async function () {
    ui = new MockUI();
    analytics = new MockAnalytics();
    watcher = new MockServerWatcher();

    await ServerWatcher.build({
      ui,
      analytics,
      watcher,
    });
  });

  describe('watcher:change', function () {
    beforeEach(function () {
      watcher.emit('change', 'foo.txt');
    });

    it('logs that the file was changed', function () {
      expect(ui.output).to.equal(`File changed: "foo.txt"${EOL}`);
    });

    it('does NOT tracks changes', function () {
      expect(analytics.tracks).to.deep.equal([]);
    });
  });

  describe('watcher:add', function () {
    beforeEach(function () {
      watcher.emit('add', 'foo.txt');
    });

    it('logs that the file was added', function () {
      expect(ui.output).to.equal(`File added: "foo.txt"${EOL}`);
    });

    it('does NOT track additions', function () {
      expect(analytics.tracks).to.deep.equal([]);
    });
  });

  describe('watcher:delete', function () {
    beforeEach(function () {
      watcher.emit('delete', 'foo.txt');
    });

    it('logs that the file was deleted', function () {
      expect(ui.output).to.equal(`File deleted: "foo.txt"${EOL}`);
    });

    it('does NOT tracks deletions', function () {
      expect(analytics.tracks).to.deep.equal([]);
    });
  });
});
