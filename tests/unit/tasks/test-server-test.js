'use strict';

var expect         = require('chai').expect;
var TestServerTask = require('../../../lib/tasks/test-server');
var MockProject    = require('../../helpers/mock-project');
var MockUI         = require('../../helpers/mock-ui');
var MockWatcher    = require('../../helpers/mock-watcher');

describe('test server', function() {
  var subject;

  it('transforms the options and invokes testem properly', function(done) {
    var ui = new MockUI();
    var watcher = new MockWatcher();

    subject = new TestServerTask({
      project: new MockProject(),
      ui: ui,
      addonMiddlewares: function() {
        return ['middleware1', 'middleware2'];
      },
      testem: {
        startDev: function(options) {
          expect(options.host).to.equal('greatwebsite.com');
          expect(options.port).to.equal(123324);
          expect(options.cwd).to.equal('blerpy-derpy');
          expect(options.reporter).to.equal('xunit');
          expect(options.middleware).to.deep.equal(['middleware1', 'middleware2']);
          expect(options.test_page).to.equal('http://my/test/page');
          expect(options.config_dir).to.be.an('string');
          done();
        }
      }
    });

    subject.run({
      host: 'greatwebsite.com',
      port: 123324,
      reporter: 'xunit',
      outputPath: 'blerpy-derpy',
      watcher: watcher,
      testPage: 'http://my/test/page'
    });
    watcher.emit('change');
  });

  describe('completion', function() {
    var ui, watcher, subject, runOptions;

    before(function() {
      ui = new MockUI();
      watcher = new MockWatcher();

      runOptions = {
        reporter: 'xunit',
        outputPath: 'blerpy-derpy',
        watcher: watcher,
        testPage: 'http://my/test/page'
      };

      subject = new TestServerTask({
        project: new MockProject(),
        ui: ui,
        addonMiddlewares: function() {
          return ['middleware1', 'middleware2'];
        },
        testem: {
          startDev: function(options, finalizer) {
            throw new TypeError('startDev not implemented');
          }
        }
      });
    });

    describe('firstRun', function() {
      it('rejects with testem exceptions', function() {
        var error = new Error('OMG');

        subject.testem.startDev = function(options, finalizer) {
          finalizer(1, error);
        };

        var runResult = subject.run(runOptions).then(function() {
          expect(true, 'should have rejected, but fulfilled').to.be.false;
        }, function(reason) {
          expect(reason).to.eql(error);
        });

        watcher.emit('change');

        return runResult;
      });

      it('resolves with exit status (1)', function() {
        subject.testem.startDev = function(options, finalizer) {
          finalizer(1);
        };

        var runResult = subject.run(runOptions).then(function(value) {
          expect(value, 'expected exist status of 1').to.eql(1);
        });

        watcher.emit('change');

        return runResult;
      });

      it('resolves with exit status (0)', function() {
        subject.testem.startDev = function(options, finalizer) {
          finalizer(0);
        };

        var runResult = subject.run(runOptions).then(function(value) {
          expect(value, 'expected exist status of 0').to.eql(0);
        });

        watcher.emit('change');

        return runResult;
      });
    });

    describe('restart', function() {
      it('rejects with testem exceptions', function() {
        var error = new Error('OMG');

        subject.testem.startDev = function(options, finalizer) {
          finalizer(1);
        };

        var runResult = subject.run(runOptions);

        watcher.emit('change');

        return runResult.then(function() {
          subject.testem.startDev = function(options, finalizer) {
            finalizer(1, error);
          };

          runResult = subject.run(runOptions).then(function() {
            expect(true, 'should have rejected, but fulfilled').to.be.false;
          }, function(reason) {
            expect(reason).to.eql(error);
          });

          watcher.emit('change');

          return runResult;
        });
      });
    });
  });
});
