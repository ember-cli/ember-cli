'use strict';

var expect            = require('chai').expect;
var LiveReloadServer  = require('../../../../lib/tasks/server/livereload-server');
var MockUI            = require('../../../helpers/mock-ui');
var MockExpressServer = require('../../../helpers/mock-express-server');
var net               = require('net');
var EOL               = require('os').EOL;
var path              = require('path');
var MockWatcher       = require('../../../helpers/mock-watcher');
var FSTree            = require('fs-tree-diff');

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
        liveReloadHost: 'localhost',
        liveReload: true
      }).then(function() {
        expect(ui.output).to.equal('Livereload server on http://localhost:1337' + EOL);
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
          expect(reason).to.equal('Livereload failed on http://localhost:1337.  It is either in use or you do not have permission.' + EOL);
        })
        .finally(function() {
          preexistingServer.close(done);
        });
    });

    it('starts with custom host', function() {
      return subject.start({
        liveReloadHost: '127.0.0.1',
        liveReloadPort: 1337,
        liveReload: true
      }).then(function() {
        expect(ui.output).to.equal('Livereload server on http://127.0.0.1:1337' + EOL);
      });
    });
  });

  describe('start with https', function() {
    it('correctly indicates which port livereload is present on and running in https mode', function() {
      return subject.start({
        liveReloadPort: 1337,
        liveReloadHost: 'localhost',
        liveReload: true,
        ssl: true,
        sslKey: 'tests/fixtures/ssl/server.key',
        sslCert: 'tests/fixtures/ssl/server.crt'
      }).then(function() {
        expect(ui.output).to.equal('Livereload server on https://localhost:1337' + EOL);
      });
    });

    it('informs of error during startup', function(done) {
      var preexistingServer = net.createServer();
      preexistingServer.listen(1337);

      return subject.start({
          liveReloadPort: 1337,
          liveReload: true,
          ssl: true,
          sslKey: 'tests/fixtures/ssl/server.key',
          sslCert: 'tests/fixtures/ssl/server.crt'
        })
        .catch(function(reason) {
          expect(reason).to.equal('Livereload failed on https://localhost:1337.  It is either in use or you do not have permission.' + EOL);
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

  describe('livereload changes', function () {
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
    var createStubbedGetDirectoryEntries = function(files) {
      return function() {
        return files.map(function(file) {
          return {
            relativePath: file,
            isDirectory: function() {
              return false;
            }
          };
        });
      };
    };

    beforeEach(function() {
      liveReloadServer = subject.liveReloadServer();
      changedCount = 0;
      oldChanged = liveReloadServer.changed;
      liveReloadServer.changed = stubbedChanged;

      trackCount = 0;
      oldTrack = subject.analytics.track;
      subject.analytics.track = stubbedTrack;

      subject.tree = new FSTree.fromEntries([]);
    });

    afterEach(function() {
      liveReloadServer.changed = oldChanged;
      subject.analytics.track = oldTrack;
      subject.project.liveReloadFilterPatterns = [];
    });

    describe('watcher events', function () {
      function watcherEventTest(eventName, expectedCount) {
        subject.getDirectoryEntries = createStubbedGetDirectoryEntries([
          'test/fixtures/proxy/file-a.js'
        ]);
        subject.project.liveReloadFilterPatterns = [];
        return subject.start({
          liveReloadPort: 1337,
          liveReload: true
        }).then(function () {
            watcher.emit(eventName, {
              directory: '/home/user/projects/my-project/tmp/something.tmp'
            });
          }).finally(function () {
            expect(changedCount).to.equal(expectedCount);
          });
      }

      it('triggers a livereload change on a watcher change event', function () {
        return watcherEventTest('change', 1);
      });

      it('triggers a livereload change on a watcher error event', function () {
        return watcherEventTest('error', 1);
      });

      it('does not trigger a livereload change on other watcher events', function () {
        return watcherEventTest('not-an-event', 0);
      });

      describe('filter pattern', function() {
        it('shouldTriggerReload must be true if there are no liveReloadFilterPatterns', function() {
          subject.project.liveReloadFilterPatterns = [];
          var result = subject.shouldTriggerReload({
            filePath: '/home/user/my-project/app/styles/app.css'
          });
          expect(result).to.be.true;
        });

        it('shouldTriggerReload is true when no liveReloadFilterPatterns matches the filePath', function() {
          var basePath = path.normalize('test/fixtures/proxy').replace(/\\/g, '\\\\');
          var filter = new RegExp('^' + basePath);

          subject.project.liveReloadFilterPatterns = [filter];
          var result = subject.shouldTriggerReload({
            filePath: '/home/user/my-project/app/styles/app.css'
          });
          expect(result).to.be.true;
        });

        it('shouldTriggerReload is false when one or more of the liveReloadFilterPatterns matches filePath', function() {
          var basePath = path.normalize('test/fixtures/proxy').replace(/\\/g, '\\\\');
          var filter = new RegExp('^' + basePath);

          subject.project.liveReloadFilterPatterns = [filter];
          var result = subject.shouldTriggerReload({
            filePath: '/home/user/my-project/test/fixtures/proxy/file-a.js'
          });
          expect(result).to.be.false;
        });

        it('shouldTriggerReload writes a banner after skipping reload for a file', function() {
          var basePath = path.normalize('test/fixtures/proxy').replace(/\\/g, '\\\\');
          var filter = new RegExp('^' + basePath);

          subject.project.liveReloadFilterPatterns = [filter];
          subject.shouldTriggerReload({
            filePath: '/home/user/my-project/test/fixtures/proxy/file-a.js'
          });
          expect(ui.output).to.equal('Skipping livereload for: ' + path.join('test', 'fixtures', 'proxy', 'file-a.js') + EOL);
        });

        it('triggers the livereload server of a change when no pattern matches', function() {
          subject.getDirectoryEntries = createStubbedGetDirectoryEntries([]);
          subject.didChange({
            filePath: '/home/user/my-project/test/fixtures/proxy/file-a.js'
          });
          expect(changedCount).to.equal(1);
          expect(trackCount).to.equal(1);
        });

        it('does not trigger livereload server of a change when there is a pattern match', function() {
          // normalize test regex for windows
          // path.normalize with change forward slashes to back slashes if test is running on windows
          // we then replace backslashes with double backslahes to escape the backslash in the regex
          var basePath = path.normalize('test/fixtures/proxy').replace(/\\/g, '\\\\');
          var filter = new RegExp('^' + basePath);

          subject.project.liveReloadFilterPatterns = [filter];

          subject.getDirectoryEntries = createStubbedGetDirectoryEntries([]);
          subject.didChange({
            filePath: '/home/user/my-project/test/fixtures/proxy/file-a.js'
          });

          expect(changedCount).to.equal(0);
          expect(trackCount).to.equal(0);
        });
      });
    });

    describe('specific files', function() {
      var reloadedFiles;

      var stubbedChanged = function(options) {
        reloadedFiles = options.body.files;
      };

      beforeEach(function() {
        liveReloadServer.changed = stubbedChanged;
      });

      afterEach(function() {
        reloadedFiles = undefined;
      });

      it('triggers livereload with modified files', function() {
        var changedFiles = [
          'assets/my-project.css',
          'assets/my-project.js'
        ];

        subject.getDirectoryEntries = createStubbedGetDirectoryEntries(changedFiles);
        subject.didChange({
          directory: '/home/user/projects/my-project/tmp/something.tmp'
        });

        expect(reloadedFiles).to.deep.equal(changedFiles);
      });

      it('triggers livereload ignoring source map files', function() {
        var changedFiles = [
          'assets/my-project.css',
          'assets/my-project.css.map'
        ];

        var expectedResult = [
          'assets/my-project.css'
        ];

        subject.getDirectoryEntries = createStubbedGetDirectoryEntries(changedFiles);
        subject.didChange({
          directory: '/home/user/projects/my-project/tmp/something.tmp'
        });

        expect(reloadedFiles).to.deep.equal(expectedResult);
      });
    });
  });
});
