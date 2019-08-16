'use strict';

const expect = require('chai').expect;
const LiveReloadServer = require('../../../../lib/tasks/server/livereload-server');
const MockUI = require('console-ui/mock');
const MockExpressServer = require('../../../helpers/mock-express-server');
const net = require('net');
const EOL = require('os').EOL;
const path = require('path');
const MockWatcher = require('../../../helpers/mock-watcher');
const express = require('express');
const FSTree = require('fs-tree-diff');
const http = require('http');

describe('livereload-server', function() {
  let subject;
  let ui;
  let watcher;
  let httpServer;
  let app;

  beforeEach(function() {
    ui = new MockUI();
    watcher = new MockWatcher();
    httpServer = new MockExpressServer();
    app = express();
    subject = new LiveReloadServer({
      app,
      ui,
      watcher,
      httpServer,
      analytics: { trackError() {} },
      project: {
        liveReloadFilterPatterns: [],
        root: '/home/user/my-project',
      },
    });
  });

  afterEach(function() {
    try {
      if (subject.liveReloadServer) {
        subject.liveReloadServer.close();
      }
    } catch (err) {
      /* ignore */
    }
  });

  describe('start', function() {
    it('does not start the server if `liveReload` option is not true', function() {
      return subject
        .setupMiddleware({
          liveReload: false,
          liveReloadPort: 4200,
          liveReloadPrefix: '/',
        })
        .then(function() {
          expect(ui.output).to.contains('WARNING: Livereload server manually disabled.');
          expect(!!subject.liveReloadServer).to.equal(false);
        });
    });
    it('informs of error during startup with custom port', function(done) {
      let preexistingServer = net.createServer();
      preexistingServer.listen(1337);
      subject
        .setupMiddleware({
          liveReload: true,
          liveReloadPort: 1337,
          liveReloadPrefix: '/',
          port: 4200,
        })
        .catch(function(reason) {
          expect(reason).to.equal(
            `Livereload failed on http://localhost:1337.  It is either in use or you do not have permission.`
          );
        })
        .finally(function() {
          preexistingServer.close(done);
        });
    });
    it('starts with custom host, custom port', function() {
      return subject
        .setupMiddleware({
          liveReloadHost: '127.0.0.1',
          liveReload: true,
          liveReloadPort: 1377,
          liveReloadPrefix: '/',
          port: 4200,
        })
        .then(function() {
          expect(subject.liveReloadServer.options.port).to.equal(1377);
          expect(subject.liveReloadServer.options.host).to.equal('127.0.0.1');
        });
    });
    it('Livereload responds to livereload requests and returns livereload file', function(done) {
      let server = app.listen(4200);
      subject
        .setupMiddleware({
          liveReload: true,
          liveReloadPrefix: '_lr',
          port: 4200,
        })
        .then(function() {
          http.get('http://localhost:4200/_lr/livereload.js', function(response) {
            expect(response.statusCode).to.equal(200);
            server.close(done);
          });
        });
    });
  });
  describe('start with https', function() {
    it('correctly runs in https mode', function() {
      return subject
        .setupMiddleware({
          liveReload: true,
          liveReloadPort: 4200,
          liveReloadPrefix: '/',
          ssl: true,
          sslKey: 'tests/fixtures/ssl/server.key',
          sslCert: 'tests/fixtures/ssl/server.crt',
          port: 4200,
        })
        .then(function() {
          expect(subject.liveReloadServer.options.key).to.be.an.instanceof(Buffer);
          expect(subject.liveReloadServer.options.cert).to.be.an.instanceof(Buffer);
        });
    });
    it('informs of error during startup', function(done) {
      let preexistingServer = net.createServer();
      preexistingServer.listen(1337);

      subject
        .setupMiddleware({
          liveReloadPort: 1337,
          liveReload: true,
          ssl: true,
          sslKey: 'tests/fixtures/ssl/server.key',
          sslCert: 'tests/fixtures/ssl/server.crt',
          port: 4200,
        })
        .catch(function(reason) {
          expect(reason).to.equal(
            `Livereload failed on https://localhost:1337.  It is either in use or you do not have permission.`
          );
        })
        .finally(function() {
          preexistingServer.close(done);
        });
    });
    it('correctly runs in https mode with custom port', function() {
      return subject
        .setupMiddleware({
          liveReload: true,
          liveReloadPort: 1337,
          liveReloadPrefix: '/',
          ssl: true,
          sslKey: 'tests/fixtures/ssl/server.key',
          sslCert: 'tests/fixtures/ssl/server.crt',
          port: 4200,
        })
        .then(function() {
          expect(subject.liveReloadServer.options.key).to.be.an.instanceof(Buffer);
          expect(subject.liveReloadServer.options.cert).to.be.an.instanceof(Buffer);
        });
    });
  });

  describe('express server restart', function() {
    it('triggers when the express server restarts', function() {
      let calls = 0;
      subject.didRestart = function() {
        calls++;
      };
      return subject
        .setupMiddleware({
          liveReload: true,
          liveReloadPrefix: '/',
          port: 4200,
        })
        .then(function() {
          subject.app.emit('restart');
          expect(calls).to.equal(1);
        });
    });
    it('triggers when the express server restarts with custom port', function() {
      let calls = 0;
      subject.didRestart = function() {
        calls++;
      };
      return subject
        .setupMiddleware({
          liveReload: true,
          liveReloadPrefix: '/',
          liveReloadPort: 1337,
          port: 4200,
        })
        .then(function() {
          subject.app.emit('restart');
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
      subject.setupMiddleware({
        liveReload: true,
        liveReloadPort: 4200,
        liveReloadPrefix: '/',
        port: 4200,
      });
      liveReloadServer = subject.liveReloadServer;
      changedCount = 0;
      oldChanged = liveReloadServer.changed;
      liveReloadServer.changed = stubbedChanged;

      trackCount = 0;
      oldTrack = subject.analytics.track;
      subject.analytics.track = stubbedTrack;

      subject.tree = FSTree.fromEntries([]);
    });

    afterEach(function() {
      liveReloadServer.changed = oldChanged;
      subject.analytics.track = oldTrack;
      subject.project.liveReloadFilterPatterns = [];
    });

    describe('watcher events', function() {
      function watcherEventTest(eventName, expectedCount) {
        subject.getDirectoryEntries = createStubbedGetDirectoryEntries(['test/fixtures/proxy/file-a.js']);
        subject.project.liveReloadFilterPatterns = [];
        watcher.emit(eventName, {
          directory: '/home/user/projects/my-project/tmp/something.tmp',
        });
        return expect(changedCount).to.equal(expectedCount);
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

        subject.getDirectoryEntries = createStubbedGetDirectoryEntries(['test/fixtures/proxy/file-a.js']);

        watcher.emit('error', compileError);
        expect(subject._hasCompileError).to.be.true;
        expect(changedCount).to.equal(1);
        watcher.emit('change', {
          directory: '/home/user/projects/my-project/tmp/something.tmp',
        });
        expect(subject._hasCompileError).to.be.false;
        expect(changedCount).to.equal(2);
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
          expect(ui.output).to.equal(
            `Skipping livereload for: ${path.join('test', 'fixtures', 'proxy', 'file-a.js')}${EOL}`
          );
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
        let changedFiles = ['assets/my-project.css', 'assets/my-project.js'];

        subject.getDirectoryEntries = createStubbedGetDirectoryEntries(changedFiles);
        subject.didChange({
          directory: '/home/user/projects/my-project/tmp/something.tmp',
        });

        expect(reloadedFiles).to.deep.equal(changedFiles);
      });

      it('triggers livereload with deleted directories', function() {
        let changedFiles = ['assets/my-project.css', 'assets/my-project.js'];

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
        let changedFiles = ['assets/my-project.css', 'assets/my-project.css.map'];

        let expectedResult = ['assets/my-project.css'];

        subject.getDirectoryEntries = createStubbedGetDirectoryEntries(changedFiles);
        subject.didChange({
          directory: '/home/user/projects/my-project/tmp/something.tmp',
        });

        expect(reloadedFiles).to.deep.equal(expectedResult);
      });

      it('triggers livereload with "LiveReload files" if no results.directory was provided', function() {
        let changedOptions;
        subject.liveReloadServer = {
          changed(options) {
            changedOptions = options;
          },
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
  describe('livereload changes with custom port', function() {
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
      subject.setupMiddleware({
        liveReload: true,
        liveReloadPort: 1337,
        liveReloadPrefix: '/',
        port: 4200,
      });
      liveReloadServer = subject.liveReloadServer;
      changedCount = 0;
      oldChanged = liveReloadServer.changed;
      liveReloadServer.changed = stubbedChanged;

      trackCount = 0;
      oldTrack = subject.analytics.track;
      subject.analytics.track = stubbedTrack;

      subject.tree = FSTree.fromEntries([]);
    });

    afterEach(function() {
      liveReloadServer.changed = oldChanged;
      subject.analytics.track = oldTrack;
      subject.project.liveReloadFilterPatterns = [];
    });

    describe('watcher events', function() {
      function watcherEventTest(eventName, expectedCount) {
        subject.getDirectoryEntries = createStubbedGetDirectoryEntries(['test/fixtures/proxy/file-a.js']);
        subject.project.liveReloadFilterPatterns = [];
        watcher.emit(eventName, {
          directory: '/home/user/projects/my-project/tmp/something.tmp',
        });
        return expect(changedCount).to.equal(expectedCount);
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

        subject.getDirectoryEntries = createStubbedGetDirectoryEntries(['test/fixtures/proxy/file-a.js']);

        watcher.emit('error', compileError);
        expect(subject._hasCompileError).to.be.true;
        expect(changedCount).to.equal(1);
        watcher.emit('change', {
          directory: '/home/user/projects/my-project/tmp/something.tmp',
        });
        expect(subject._hasCompileError).to.be.false;
        expect(changedCount).to.equal(2);
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
          expect(ui.output).to.equal(
            `Skipping livereload for: ${path.join('test', 'fixtures', 'proxy', 'file-a.js')}${EOL}`
          );
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
      let changedOptions;

      let stubbedChanged = function(options) {
        reloadedFiles = options.body.files;
        changedOptions = options;
      };

      beforeEach(function() {
        liveReloadServer.changed = stubbedChanged;
      });

      afterEach(function() {
        reloadedFiles = undefined;
      });

      it('triggers livereload with modified files', function() {
        let changedFiles = ['assets/my-project.css', 'assets/my-project.js'];

        subject.getDirectoryEntries = createStubbedGetDirectoryEntries(changedFiles);
        subject.didChange({
          directory: '/home/user/projects/my-project/tmp/something.tmp',
        });

        expect(reloadedFiles).to.deep.equal(changedFiles);
      });

      it('triggers livereload with deleted directories', function() {
        let changedFiles = ['assets/my-project.css', 'assets/my-project.js'];

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
        let changedFiles = ['assets/my-project.css', 'assets/my-project.css.map'];

        let expectedResult = ['assets/my-project.css'];

        subject.getDirectoryEntries = createStubbedGetDirectoryEntries(changedFiles);
        subject.didChange({
          directory: '/home/user/projects/my-project/tmp/something.tmp',
        });

        expect(reloadedFiles).to.deep.equal(expectedResult);
      });

      it('triggers livereload with "LiveReload files" if no results.directory was provided', function() {
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
