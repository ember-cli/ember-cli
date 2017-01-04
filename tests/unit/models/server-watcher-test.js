'use strict';

let expect = require('chai').expect;
let EOL = require('os').EOL;
let MockUI = require('console-ui/mock');
let MockAnalytics = require('../../helpers/mock-analytics');
let MockServerWatcher = require('../../helpers/mock-watcher');
let ServerWatcher = require('../../../lib/models/server-watcher');

describe('Server Watcher', function() {
  let ui;
  let subject;
  let analytics;
  let watcher;

  beforeEach(function() {
    ui = new MockUI();
    analytics = new MockAnalytics();
    watcher = new MockServerWatcher();

    subject = new ServerWatcher({
      ui,
      analytics,
      watcher,
    });
  });

  describe('watcher:change', function() {
    beforeEach(function() {
      watcher.emit('change', 'foo.txt');
    });

    it('logs that the file was changed', function() {
      expect(ui.output).to.equal(`File changed: "foo.txt"${EOL}`);
    });

    it('tracks changes', function() {
      expect(analytics.tracks).to.deep.equal([{
        name: 'server file changed',
        description: 'File changed: "foo.txt"',
      }]);
    });
  });

  describe('watcher:add', function() {
    beforeEach(function() {
      watcher.emit('add', 'foo.txt');
    });

    it('logs that the file was added', function() {
      expect(ui.output).to.equal(`File added: "foo.txt"${EOL}`);
    });

    it('tracks additions', function() {
      expect(analytics.tracks).to.deep.equal([{
        name: 'server file addition',
        description: 'File added: "foo.txt"',
      }]);
    });
  });

  describe('watcher:delete', function() {
    beforeEach(function() {
      watcher.emit('delete', 'foo.txt');
    });

    it('logs that the file was deleted', function() {
      expect(ui.output).to.equal(`File deleted: "foo.txt"${EOL}`);
    });

    it('tracks deletions', function() {
      expect(analytics.tracks).to.deep.equal([{
        name: 'server file deletion',
        description: 'File deleted: "foo.txt"',
      }]);
    });
  });
});
