'use strict';

const { expect } = require('chai');
const EOL = require('os').EOL;
const MockUI = require('console-ui/mock');
const MockServerWatcher = require('../../helpers/mock-watcher');
const ServerWatcher = require('../../../lib/models/server-watcher');

describe('Server Watcher', function () {
  let ui;
  let watcher;

  beforeEach(async function () {
    ui = new MockUI();
    watcher = new MockServerWatcher();

    class ServerWatcherMock extends ServerWatcher {
      setupBroccoliWatcher() {
        this.watcher = watcher;

        return super.setupBroccoliWatcher(...arguments);
      }
    }

    await ServerWatcherMock.build({
      ui,
    });
  });

  describe('watcher:change', function () {
    beforeEach(function () {
      watcher.emit('change', 'foo.txt');
    });

    it('logs that the file was changed', function () {
      expect(ui.output).to.equal(`File changed: "foo.txt"${EOL}`);
    });
  });

  describe('watcher:add', function () {
    beforeEach(function () {
      watcher.emit('add', 'foo.txt');
    });

    it('logs that the file was added', function () {
      expect(ui.output).to.equal(`File added: "foo.txt"${EOL}`);
    });
  });

  describe('watcher:delete', function () {
    beforeEach(function () {
      watcher.emit('delete', 'foo.txt');
    });

    it('logs that the file was deleted', function () {
      expect(ui.output).to.equal(`File deleted: "foo.txt"${EOL}`);
    });
  });
});
