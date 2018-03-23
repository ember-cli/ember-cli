'use strict';

const expect = require('../../chai').expect;
const SilentError = require('silent-error');
const TestServerTask = require('../../../lib/tasks/test-server');
const MockProject = require('../../helpers/mock-project');
const MockUI = require('console-ui/mock');
const MockWatcher = require('../../helpers/mock-watcher');

describe('test server', function() {
  let subject;

  it('transforms the options and invokes testem properly', function(done) {
    let ui = new MockUI();
    let watcher = new MockWatcher();

    subject = new TestServerTask({
      project: new MockProject(),
      ui,
      addonMiddlewares() {
        return ['middleware1', 'middleware2'];
      },
      testem: {
        startDev(options) {
          expect(options.host).to.equal('greatwebsite.com');
          expect(options.port).to.equal(123324);
          expect(options.cwd).to.equal('blerpy-derpy');
          expect(options.reporter).to.equal('xunit');
          expect(options.middleware).to.deep.equal(['middleware1', 'middleware2']);
          expect(options.test_page).to.equal('http://my/test/page');
          expect(options.config_dir).to.be.an('string');
          done();
        },
      },
    });

    subject.run({
      host: 'greatwebsite.com',
      port: 123324,
      reporter: 'xunit',
      outputPath: 'blerpy-derpy',
      watcher,
      testPage: 'http://my/test/page',
    });
    watcher.emit('change');
  });

  it('transforms and sets defaultOptions in testem and invokes testem properly', function(done) {
    let ui = new MockUI();
    let watcher = new MockWatcher();

    subject = new TestServerTask({
      project: new MockProject(),
      ui,
      addonMiddlewares() {
        return ['middleware1', 'middleware2'];
      },
      testem: {
        setDefaultOptions(options) {
          this.defaultOptions = options;
        },
        startDev(options, finalizer) {
          this.config.setDefaultOptions(options);
          finalizer(0);
        },
        config: {
          setDefaultOptions(options) {
            this.defaultOptions = options;
          },
        },
      },
    });

    subject.run({
      host: 'greatwebsite.com',
      port: 123324,
      reporter: 'xunit',
      outputPath: 'blerpy-derpy',
      watcher,
      testPage: 'http://my/test/page',
    }).then(function(value) {
      expect(value, 'expected exist status of 0').to.eql(0);
    });
    watcher.emit('change');
    done();
  });

  describe('completion', function() {
    let ui, watcher, subject, runOptions;

    before(function() {
      ui = new MockUI();
      watcher = new MockWatcher();

      runOptions = {
        reporter: 'xunit',
        outputPath: 'blerpy-derpy',
        watcher,
        testPage: 'http://my/test/page',
      };

      subject = new TestServerTask({
        project: new MockProject(),
        ui,
        addonMiddlewares() {
          return ['middleware1', 'middleware2'];
        },
        testem: {
          startDev(/* options, finalizer */) {
            throw new TypeError('startDev not implemented');
          },
        },
      });
    });

    describe('firstRun', function() {
      it('rejects with testem exceptions', function() {
        let error = new Error('OMG');

        subject.testem.startDev = function(options, finalizer) {
          finalizer(1, error);
        };

        let runResult = expect(subject.run(runOptions)).to.be.rejected.then(reason => {
          expect(reason).to.eql(error);
        });

        watcher.emit('change');

        return runResult;
      });

      it('rejects with exit status (1)', function() {
        let error = new SilentError('Testem finished with non-zero exit code. Tests failed.');

        subject.testem.startDev = function(options, finalizer) {
          finalizer(1);
        };

        let runResult = expect(subject.run(runOptions)).to.be.rejected.then(reason => {
          expect(reason).to.eql(error);
        });

        watcher.emit('change');

        return runResult;
      });

      it('resolves with exit status (0)', function() {
        subject.testem.startDev = function(options, finalizer) {
          finalizer(0);
        };

        let runResult = subject.run(runOptions).then(function(value) {
          expect(value, 'expected exist status of 0').to.eql(0);
        });

        watcher.emit('change');

        return runResult;
      });
    });

    describe('restart', function() {
      it('rejects with testem exceptions', function() {
        let error = new Error('OMG');

        subject.testem.startDev = function(options, finalizer) {
          finalizer(0);
        };

        let runResult = subject.run(runOptions);

        watcher.emit('change');

        return runResult.then(function() {
          subject.testem.startDev = function(options, finalizer) {
            finalizer(0, error);
          };

          runResult = expect(subject.run(runOptions)).to.be.rejected.then(reason => {
            expect(reason).to.eql(error);
          });

          watcher.emit('change');

          return runResult;
        });
      });
    });
  });
});
