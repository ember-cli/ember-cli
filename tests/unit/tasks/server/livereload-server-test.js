'use strict';

var expect            = require('chai').expect;
var LiveReloadServer  = require('../../../../lib/tasks/server/livereload-server');
var MockUI            = require('../../../helpers/mock-ui');
var MockExpressServer = require('../../../helpers/mock-express-server');
var net               = require('net');
var EOL               = require('os').EOL;
var path              = require('path');
var MockWatcher       = require('../../../helpers/mock-watcher');

describe('livereload-server', function() {
  var subject;
  var ui;
  var watcher;
  var expressServer;

  beforeEach(function() {
    ui = new MockUI();
    watcher = new MockWatcher();
    expressServer = new MockExpressServer();

    subject = new LiveReloadServer({
      ui: ui,
      watcher: watcher,
      expressServer: expressServer,
      analytics: { trackError: function() { } },
      project: {
        liveReloadFilterPatterns: [],
        root: '/home/user/my-project'
      }
    });
  });

  afterEach(function() {
    try {
      if (subject._liveReloadServer) {
        subject._liveReloadServer.close();
      }
    } catch (err) { }
  });

  describe('start', function() {
    it('does not start the server if `liveReload` option is not true', function() {
      return subject.start({
        liveReloadPort: 1337,
        liveReload: false
      }).then(function(output) {
        expect(output).to.equal('Livereload server manually disabled.');
        expect(!!subject._liveReloadServer).to.equal(false);
      });
    });

    it('correctly indicates which port livereload is present on', function() {
      return subject.start({
        liveReloadPort: 1337,
        liveReload: true
      }).then(function() {
        expect(ui.output).to.equal('Livereload server on port 1337' + EOL);
      });
    });

    it('informs of error during startup', function(done) {
      var preexistingServer = net.createServer();
      preexistingServer.listen(1337);

      return subject.start({
          liveReloadPort: 1337,
          liveReload: true
        })
        .catch(function(reason) {
          expect(reason).to.equal('Livereload failed on port 1337.  It is either in use or you do not have permission.' + EOL);
        })
        .finally(function() {
          preexistingServer.close(done);
        });
    });
  });

  describe('express server restart', function() {
    it('triggers when the express server restarts', function() {
      var calls = 0;
      subject.didRestart = function () {
        calls++;
      };

      return subject.start({
          liveReloadPort: 1337,
          liveReload: true
        }).then(function () {
          expressServer.emit('restart');
          expect(calls).to.equal(1);
        });
    });
  });

  describe('filter pattern', function() {
    var liveReloadServer;
    var changedCount;
    var oldChanged;
    var stubbedChanged = function() {
      changedCount += 1;
    };

    var trackCount;
    var oldTrack;
    var stubbedTrack = function() {
      trackCount += 1;
    };

    beforeEach(function() {
      liveReloadServer = subject.liveReloadServer();
      changedCount = 0;
      oldChanged = liveReloadServer.changed;
      liveReloadServer.changed = stubbedChanged;

      trackCount = 0;
      oldTrack = subject.analytics.track;
      subject.analytics.track = stubbedTrack;
    });

    afterEach(function() {
      liveReloadServer.changed = oldChanged;
      subject.analytics.track = oldTrack;
      subject.project.liveReloadFilterPatterns = [];
    });

    it('triggers the liverreload server of a change when no pattern matches', function() {
      subject.didChange({outputChanges: ['']});
      expect(changedCount).to.equal(1);
      expect(trackCount).to.equal(1);
    });

    it('does not trigger livereoad server of a change when there is a pattern match', function() {
      // normalize test regex for windows
      // path.normalize with change forward slashes to back slashes if test is running on windows
      // we then replace backslashes with double backslahes to escape the backslash in the regex
      var basePath = path.normalize('test/fixtures/proxy').replace(/\\/g, '\\\\');
      var filter = new RegExp('^' + basePath);
      subject.project.liveReloadFilterPatterns = [filter];

      subject.didChange({
        outputChanges: ['test/fixtures/proxy/file-a.js']
      });
      expect(changedCount).to.equal(0);
      expect(trackCount).to.equal(0);
    });
  });

  describe('watcher', function() {
    var liveReloadServer;
    var changedFiles;
    var oldChanged;
    var stubbedChanged = function(changed) {
      changedFiles = changed.body.files;
    };
    var oldTrack;
    var stubbedTrack = function() {};

    beforeEach(function() {
      liveReloadServer = subject.liveReloadServer();
      changedFiles = null;
      oldChanged = liveReloadServer.changed;
      liveReloadServer.changed = stubbedChanged;

      oldTrack = subject.analytics.track;
      subject.analytics.track = stubbedTrack;
    });

    afterEach(function() {
      liveReloadServer.changed = oldChanged;
      subject.analytics.track = oldTrack;
    });

    it('reports which files have changed', function() {
      var files = ['output.css'];
      subject.didChange({
        outputChanges: files
      });
      expect(changedFiles[0]).to.equal(files[0]);
    });
  });

});
