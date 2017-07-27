'use strict';

const expect = require('chai').expect;

const MockUI = require('console-ui/mock');
const WatchDetector = require('../../../lib/models/watch-detector');

describe('WatchDetector', function() {
  let ui;
  let subject;
  let fs, childProcess;

  beforeEach(function() {
    ui = new MockUI();

    fs = {};
    childProcess = {};

    subject = new WatchDetector({
      ui,
      fs,
      childProcess,
      watchmanSupportsPlatform: false,
      root: process.cwd(),
    });
  });

  describe('#checkNodeWatcher', function() {
    it('reports NO if fs.watch throws', function() {
      fs.watch = function() {
        throw new Error('Something went wrong');
      };

      expect(subject.checkNodeWatcher()).to.be.false;
    });

    // we could extend this to test also if change events are triggered or not..
    it('reports YES if nothing throws', function() {
      fs.watch = function() { return { close() { } }; };

      expect(subject.checkNodeWatcher()).to.be.true;
    });
  });


  describe('#findBestWatcherOption', function() {
    describe('input preference.watcher === watchman', function() {
      beforeEach(function() {
        childProcess.execSync = function() {
          return '{"version":"3.0.0"}';
        };
      });

      it('chooses watchman', function() {
        let option = subject.findBestWatcherOption({ watcher: 'watchman' });
        expect(option).to.have.property('watcher', 'watchman');
        expect(option.watchmanInfo).to.have.property('version');
        expect(option.watchmanInfo).to.have.property('canNestRoots');
        expect(option.watchmanInfo).to.have.property('enabled', true);
        expect(ui.output).to.match(/Selected watchman watcher/);
      });

      describe('watchman does not work', function() {
        beforeEach(function() {
          childProcess.execSync = function() {
            throw new Error('');
          };
        });

        it('falls back to node if it can', function() {
          fs.watch = function() { return { close() { } }; };

          let option = subject.findBestWatcherOption({ watcher: 'watchman' });
          expect(option.watchmanInfo).to.have.property('enabled', false);
          expect(option).to.have.property('watcher', 'node');
          expect(option.watchmanInfo).to.have.property('version');
          expect(option.watchmanInfo).to.have.property('canNestRoots');
          expect(ui.output).to.match(/Could not use watchman watcher, falling back to node/);
        });

        it('falls back to polling if node does not work', function() {
          fs.watch = function() {
            throw new Error('something went wrong');
          };

          let option = subject.findBestWatcherOption({ watcher: 'watchman' });
          expect(option).to.have.property('watcher', 'polling');
          expect(option.watchmanInfo).to.have.property('enabled', false);
          expect(option.watchmanInfo).to.have.property('version');
          expect(option.watchmanInfo).to.have.property('canNestRoots');
          expect(ui.output).to.match(/Could not use watchman watcher, falling back to polling/);
        });
      });
    });

    describe('input preference.watcher === polling', function() {
      it('simply works', function() {
        // we assuming polling can never not work, if it doesn't sorry..
        let option = subject.findBestWatcherOption({ watcher: 'polling' });
        expect(option.watchmanInfo).to.have.property('enabled', false);
        expect(option).to.have.property('watcher', 'polling');
        expect(ui.output).to.match(/Selected polling watcher/);
      });
    });

    describe('input preference.watcher === node', function() {
      it('chooses node, if everything  seems ok', function() {
        fs.watch = function() { return { close() { } }; };

        // we assuming polling can never not work, if it doesn't sorry..
        let option = subject.findBestWatcherOption({ watcher: 'node' });
        expect(option).to.have.property('watcher', 'node');
        expect(ui.output).to.match(/Selected node watcher/);
      });

      it('false back to polling if watch fails', function() {
        fs.watch = function() {
          throw new Error('OMG');
        };
        // we assuming polling can never not work, if it doesn't sorry..
        let option = subject.findBestWatcherOption({ watcher: 'node' });
        expect(option).to.have.property('watcher', 'polling');
        expect(ui.output).to.match(/Could not use node watcher, falling back to polling/);
      });

      it('falls back to polling if unwatch fails', function() {
        fs.watch = function() {
          // works
        };
        fs.unwatch = function() {
          throw new Error('OMG');
        };
        // we assuming polling can never not work, if it doesn't sorry..
        let option = subject.findBestWatcherOption({ watcher: 'node' });
        expect(option).to.have.property('watcher', 'polling');
        expect(ui.output).to.match(/Could not use node watcher, falling back to polling/);
      });
    });

  });

  describe('#getWatchmanWatcher', function() {
    describe('Returns null if there are issues', function() {
      let iff = it;

      iff('the exec rejects', function() {
        childProcess.execSync = function() {
          throw new Error();
        };

        let preference = subject.getWatchmanWatcher();
        expect(preference).to.eql(null);
      });

      iff('the `watchman version` doesn\'t parse', function() {
        childProcess.execSync = function() {
          return 'not json';
        };

        let preference = subject.getWatchmanWatcher();
        expect(preference).to.eql(null);
      });


      iff('the `watchman version` doesn\'t satisfy => 3.0.0', function() {
        childProcess.execSync = function() {
          return '{"version":"2.9.9"}';
        };

        let preference = subject.getWatchmanWatcher();
        expect(preference).to.eql(null);
      });
    });
  });
});
