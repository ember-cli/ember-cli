'use strict';

const expect = require('chai').expect;
const LiveReloadServer = require('../../../../lib/tasks/server/livereload-server');
const MockUI = require('console-ui/mock');
const MockExpressServer = require('../../../helpers/mock-express-server');
const net = require('net');
const EOL = require('os').EOL;
const path = require('path');
const MockWatcher = require('../../../helpers/mock-watcher');
const FSTree = require('fs-tree-diff');

describe('livereload-server', function() {
  let subject;
  let ui;
  let watcher;
  let expressServer;

  beforeEach(function() {
    ui = new MockUI();
    watcher = new MockWatcher();
    expressServer = new MockExpressServer();

    subject = new LiveReloadServer({
      ui,
      watcher,
      expressServer,
      analytics: { trackError() { } },
      project: {
        liveReloadFilterPatterns: [],
        root: '/home/user/my-project',
      },
    });
  });

  afterEach(function() {
    try {
      if (subject._liveReloadServer) {
        subject._liveReloadServer.close();
      }
    } catch (err) { /* ignore */ }
  });

  describe('start', function() {
    it('does not start the server if `liveReload` option is not true', function() {
      return subject.start({
        liveReloadPort: 1337,
        liveReload: false,
      }).then(function(output) {
        expect(output).to.equal('Livereload server manually disabled.');
        expect(!!subject._liveReloadServer).to.equal(false);
      });
    });

    it('correctly indicates which port livereload is present on', function() {
      return subject.start({
        liveReloadPort: 1337,
        liveReloadHost: 'localhost',
        liveReload: true,
      }).then(function() {
        expect(ui.output).to.equal(`Livereload server on http://localhost:1337${EOL}`);
      });
    });

    it('informs of error during startup', function(done) {
      let preexistingServer = net.createServer();
      preexistingServer.listen(1337);

      subject.start({
        liveReloadPort: 1337,
        liveReload: true,
      })
        .catch(function(reason) {
          expect(reason).to.equal(`Livereload failed on http://localhost:1337.  It is either in use or you do not have permission.${EOL}`);
        })
        .finally(function() {
          preexistingServer.close(done);
        });
    });

    it('starts with custom host', function() {
      return subject.start({
        liveReloadHost: '127.0.0.1',
        liveReloadPort: 1337,
        liveReload: true,
      }).then(function() {
        expect(ui.output).to.equal(`Livereload server on http://127.0.0.1:1337${EOL}`);
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
        sslCert: 'tests/fixtures/ssl/server.crt',
      }).then(function() {
        expect(ui.output).to.equal(`Livereload server on https://localhost:1337${EOL}`);
      });
    });

    it('informs of error during startup', function(done) {
      let preexistingServer = net.createServer();
      preexistingServer.listen(1337);

      subject.start({
        liveReloadPort: 1337,
        liveReload: true,
        ssl: true,
        sslKey: 'tests/fixtures/ssl/server.key',
        sslCert: 'tests/fixtures/ssl/server.crt',
      })
        .catch(function(reason) {
          expect(reason).to.equal(`Livereload failed on https://localhost:1337.  It is either in use or you do not have permission.${EOL}`);
        })
        .finally(function() {
          preexistingServer.close(done);
        });
    });
  });

  describe('express server restart', function() {
    it('triggers when the express server restarts', function() {
      let calls = 0;
      subject.didRestart = function() {
        calls++;
      };

      return subject.start({
        liveReloadPort: 1337,
        liveReload: true,
      }).then(function() {
        expressServer.emit('restart');
        expect(calls).to.equal(1);
      });
    });
  });

  describe('livereload changes', function() {
    let liveReloadServer;
    let changedCount;
    let oldChanged;
    let stubbedChanged = function() {
      changedCount += 1;
    };
    let trackCount;
    let oldTrack;
    let stubbedTrack = function() {
      trackCount += 1;
    };
    let createStubbedGetDirectoryEntries = function(files) {
      return function() {
        return files.map(function(file) {
          return {
            relativePath: file,
            isDirectory() {
              return false;
            },
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

    describe('watcher events', function() {
      function watcherEventTest(eventName, expectedCount) {
        subject.getDirectoryEntries = createStubbedGetDirectoryEntries([
          'test/fixtures/proxy/file-a.js',
        ]);
        subject.project.liveReloadFilterPatterns = [];
        return subject.start({
          liveReloadPort: 1337,
          liveReload: true,
        }).then(function() {
          watcher.emit(eventName, {
            directory: '/home/user/projects/my-project/tmp/something.tmp',
          });
        }).finally(function() {
          expect(changedCount).to.equal(expectedCount);
        });
      }

      it('triggers a livereload change on a watcher change event', function() {
        return watcherEventTest('change', 1);
      });

      it('triggers a livereload change on a watcher error event', function() {
        return watcherEventTest('error', 1);
      });

      it('does not trigger a livereload change on other watcher events', function() {
        return watcherEventTest('not-an-event', 0);
      });

      it('recovers from error when file is already cached in previous cache step', function() {
        let compileError = function() {
          try {
            throw new Error('Compile time error');
          } catch (error) {
            return error;
          }
        }.apply();

        subject.getDirectoryEntries = createStubbedGetDirectoryEntries([
          'test/fixtures/proxy/file-a.js',
        ]);

        return subject.start({
          liveReloadPort: 1337,
          liveReload: true,
        }).then(function() {
          return watcher.emit('error', compileError);
        }).then(function(result) {
          expect(result).to.be.true;
          expect(subject._hasCompileError).to.be.true;
          expect(changedCount).to.equal(1);
          return watcher.emit('change', {
            directory: '/home/user/projects/my-project/tmp/something.tmp',
          });
        }).then(function(result) {
          expect(result).to.be.true;
          expect(subject._hasCompileError).to.be.false;
          expect(changedCount).to.equal(2);
        });
      });

      describe('filter pattern', function() {
        it('shouldTriggerReload must be true if there are no liveReloadFilterPatterns', function() {
          subject.project.liveReloadFilterPatterns = [];
          let result = subject.shouldTriggerReload({
            filePath: '/home/user/my-project/app/styles/app.css',
          });
          expect(result).to.be.true;
        });

        it('shouldTriggerReload is true when no liveReloadFilterPatterns matches the filePath', function() {
          let basePath = path.normalize('test/fixtures/proxy').replace(/\\/g, '\\\\');
          let filter = new RegExp(`^${basePath}`);

          subject.project.liveReloadFilterPatterns = [filter];
          let result = subject.shouldTriggerReload({
            filePath: '/home/user/my-project/app/styles/app.css',
          });
          expect(result).to.be.true;
        });

        it('shouldTriggerReload is false when one or more of the liveReloadFilterPatterns matches filePath', function() {
          let basePath = path.normalize('test/fixtures/proxy').replace(/\\/g, '\\\\');
          let filter = new RegExp(`^${basePath}`);

          subject.project.liveReloadFilterPatterns = [filter];
          let result = subject.shouldTriggerReload({
            filePath: '/home/user/my-project/test/fixtures/proxy/file-a.js',
          });
          expect(result).to.be.false;
        });

        it('shouldTriggerReload writes a banner after skipping reload for a file', function() {
          let basePath = path.normalize('test/fixtures/proxy').replace(/\\/g, '\\\\');
          let filter = new RegExp(`^${basePath}`);

          subject.project.liveReloadFilterPatterns = [filter];
          subject.shouldTriggerReload({
            filePath: '/home/user/my-project/test/fixtures/proxy/file-a.js',
          });
          expect(ui.output).to.equal(`Skipping livereload for: ${path.join('test', 'fixtures', 'proxy', 'file-a.js')}${EOL}`);
        });

        it('triggers the livereload server of a change when no pattern matches', function() {
          subject.getDirectoryEntries = createStubbedGetDirectoryEntries([]);
          subject.didChange({
            filePath: '/home/user/my-project/test/fixtures/proxy/file-a.js',
          });
          expect(changedCount).to.equal(1);
          expect(trackCount).to.equal(1);
        });

        it('does not trigger livereload server of a change when there is a pattern match', function() {
          // normalize test regex for windows
          // path.normalize with change forward slashes to back slashes if test is running on windows
          // we then replace backslashes with double backslahes to escape the backslash in the regex
          let basePath = path.normalize('test/fixtures/proxy').replace(/\\/g, '\\\\');
          let filter = new RegExp(`^${basePath}`);

          subject.project.liveReloadFilterPatterns = [filter];

          subject.getDirectoryEntries = createStubbedGetDirectoryEntries([]);
          subject.didChange({
            filePath: '/home/user/my-project/test/fixtures/proxy/file-a.js',
          });

          expect(changedCount).to.equal(0);
          expect(trackCount).to.equal(0);
        });
      });
    });

    describe('specific files', function() {
      let reloadedFiles;

      let stubbedChanged = function(options) {
        reloadedFiles = options.body.files;
      };

      beforeEach(function() {
        liveReloadServer.changed = stubbedChanged;
      });

      afterEach(function() {
        reloadedFiles = undefined;
      });

      it('triggers livereload with modified files', function() {
        let changedFiles = [
          'assets/my-project.css',
          'assets/my-project.js',
        ];

        subject.getDirectoryEntries = createStubbedGetDirectoryEntries(changedFiles);
        subject.didChange({
          directory: '/home/user/projects/my-project/tmp/something.tmp',
        });

        expect(reloadedFiles).to.deep.equal(changedFiles);
      });

      it('triggers livereload with deleted directories', function() {
        let changedFiles = [
          'assets/my-project.css',
          'assets/my-project.js',
        ];

        subject.getDirectoryEntries = createStubbedGetDirectoryEntries(changedFiles);
        subject.didChange({
          directory: '/home/user/projects/my-project/tmp/something.tmp',
        });
        expect(reloadedFiles).to.deep.equal(changedFiles);

        // Pretend every files were removed from the tree.
        subject.getDirectoryEntries = createStubbedGetDirectoryEntries([]);
        subject.didChange({
          directory: '/home/user/projects/my-project/tmp/something.tmp',
        });
        expect(reloadedFiles).to.deep.equal([]);
      });

      it('triggers livereload ignoring source map files', function() {
        let changedFiles = [
          'assets/my-project.css',
          'assets/my-project.css.map',
        ];

        let expectedResult = [
          'assets/my-project.css',
        ];

        subject.getDirectoryEntries = createStubbedGetDirectoryEntries(changedFiles);
        subject.didChange({
          directory: '/home/user/projects/my-project/tmp/something.tmp',
        });

        expect(reloadedFiles).to.deep.equal(expectedResult);
      });

      it('triggers livereload with "LiveReload files" if no results.directory was provided', function() {
        let changedOptions;
        subject.liveReloadServer = function() {
          return {
            changed(options) {
              changedOptions = options;
            },
          };
        };

        subject.didChange({});

        expect(changedOptions).to.deep.equal({
          body: {
            files: ['LiveReload files'],
          },
        });
      });
    });
  });
});
