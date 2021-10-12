'use strict';

const expect = require('chai').expect;

const MockUI = require('console-ui/mock');
const WatchDetector = require('../../../lib/models/watch-detector');
const EOL = require('os').EOL;

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

  it('#extractPreferenceFromOptions works', function() {
    expect(subject.extractPreferenceFromOptions({})).to.have.property('watcher', 'watchman');
    expect(subject.extractPreferenceFromOptions({ watcher: 'polling' })).to.have.property('watcher', 'polling');
    expect(subject.extractPreferenceFromOptions({ watcher: 'node' })).to.have.property('watcher', 'node');
    expect(subject.extractPreferenceFromOptions({ watcher: 'nodsdfe' })).to.have.property('watcher', 'watchman');
  });

  describe('#testIfNodeWatcherAppearsToWork', function() {
    it('reports NO if fs.watch throws', function() {
      fs.watch = function() {
        throw new Error('Something went wrong');
      };

      expect(subject.testIfNodeWatcherAppearsToWork()).to.be.false;
    });

    // we could extend this to test also if change events are triggered or not..
    it('reports YES if nothing throws', function() {
      fs.watch = function() { return { close() { } }; };

      expect(subject.testIfNodeWatcherAppearsToWork()).to.be.true;
    });
  });


  describe('#findBestWatcherOption', function() {
    describe('input preference.watcher === watchman', function() {
      describe('watchman version is date-based', function() {
        beforeEach(function() {
          childProcess.execSync = function () {
            return '{"version":"v2021.10.11.00"}';
          };
        });

        it("chooses watchman", function () {
          let option = subject.findBestWatcherOption({
            watcher: "watchman",
          });
          expect(option).to.have.property("watcher", "watchman");
          expect(option.watchmanInfo).to.have.property("version");
          expect(option.watchmanInfo).to.have.property("canNestRoots");
          expect(option.watchmanInfo).to.have.property("enabled", true);
          expect(ui.output).not.to.match(/Could not start watchman/);
          expect(ui.output).not.to.match(/fell back to: "node"/);
          expect(ui.output).not.to.match(
            /Visit https:\/\/ember-cli.com\/user-guide\/\#watchman/
          );
        });
      });

      describe('watchman version complies with semver', function() {
        beforeEach(function () {
          childProcess.execSync = function () {
            return '{"version":"3.0.0"}';
          };
        });

        it("chooses watchman", function () {
          let option = subject.findBestWatcherOption({ watcher: "watchman" });
          expect(option).to.have.property("watcher", "watchman");
          expect(option.watchmanInfo).to.have.property("version");
          expect(option.watchmanInfo).to.have.property("canNestRoots");
          expect(option.watchmanInfo).to.have.property("enabled", true);
          expect(ui.output).not.to.match(/Could not start watchman/);
          expect(ui.output).not.to.match(/fell back to: "node"/);
          expect(ui.output).not.to.match(
            /Visit https:\/\/ember-cli.com\/user-guide\/\#watchman/
          );
        });
      });

      describe('watchman does not work', function() {
        beforeEach(function() {
          childProcess.execSync = function() {
            throw new Error('');
          };
        });

        it('false back to node if it can', function() {
          fs.watch = function() { return { close() { } }; };

          let option = subject.findBestWatcherOption({ watcher: 'watchman' });
          expect(option.watchmanInfo).to.have.property('enabled', false);
          expect(option).to.have.property('watcher', 'node');
          expect(option.watchmanInfo).to.have.property('version');
          expect(option.watchmanInfo).to.have.property('canNestRoots');
          expect(ui.output).to.match(/Could not start watchman/);
          expect(ui.output).to.match(/fell back to: "node"/);
          expect(ui.output).to.match(/Visit https:\/\/ember-cli.com\/user-guide\/\#watchman/);
        });

        it('false back to polling if node does not work', function() {
          fs.watch = function() {
            throw new Error('something went wrong');
          };

          let option = subject.findBestWatcherOption({ watcher: 'watchman' });
          expect(option).to.have.property('watcher', 'polling');
          expect(option.watchmanInfo).to.have.property('enabled', false);
          expect(option.watchmanInfo).to.have.property('version');
          expect(option.watchmanInfo).to.have.property('canNestRoots');
          expect(ui.output).to.match(/Could not start watchman/);
          expect(ui.output).to.match(/fell back to: "polling"/);
          expect(ui.output).to.match(/Visit https:\/\/ember-cli.com\/user-guide\/\#watchman/);
        });
      });
    });

    describe('input preference.watcher === polling', function() {
      it('simply works', function() {
        // we assuming polling can never not work, if it doesn't sorry..
        let option = subject.findBestWatcherOption({ watcher: 'polling' });
        expect(option.watchmanInfo).to.have.property('enabled', false);
        expect(option).to.have.property('watcher', 'polling');
        expect(ui.output).to.eql('');
      });
    });

    describe('input preference.watcher === node', function() {
      it('chooses node, if everything  seems ok', function() {
        fs.watch = function() { return { close() { } }; };

        // we assuming polling can never not work, if it doesn't sorry..
        let option = subject.findBestWatcherOption({ watcher: 'node' });
        expect(option).to.have.property('watcher', 'node');
        expect(ui.output).to.eql('');
      });

      it('false back to polling if watch fails', function() {
        fs.watch = function() {
          throw new Error('OMG');
        };
        // we assuming polling can never not work, if it doesn't sorry..
        let option = subject.findBestWatcherOption({ watcher: 'node' });
        expect(option).to.have.property('watcher', 'polling');
        expect(ui.output).to.eql(`was unable to use: "node", fell back to: "polling"${EOL}`);
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
        expect(ui.output).to.eql(`was unable to use: "node", fell back to: "polling"${EOL}`);
      });
    });

  });

  describe('#checkWatchman', function() {
    describe('watchmanSupportsPlatform', function() {
      it('true: hides the "watchman not found, falling back to XYZ message"', function() {
        subject.watchmanSupportsPlatform = true;

        childProcess.execSync = function() {
          throw new Error();
        };
        fs.watch = function() { return { close() { } }; };

        let result = subject.checkWatchman();
        expect(result).to.have.property('watcher', 'node');
        expect(ui.output).to.eql('');
      });

      it('false: shows the "watchman not found, falling back to XYZ message"', function() {
        subject.watchmanSupportsPlatform = false;
        fs.watch = function() { return { close() { } }; };

        childProcess.execSync = function() {
          throw new Error();
        };

        let result = subject.checkWatchman();
        expect(result).to.have.property('watcher', 'node');
        expect(ui.output).to.match(/Could not start watchman/);
        expect(ui.output).to.match(/Visit https:\/\/ember-cli.com\/user-guide\/\#watchman/);
      });
    });
    it('prefers watchman if everything appears to be good', function() {
      childProcess.execSync = function() {
        return '{"version":"3.0.0"}';
      };

      let preference = subject.checkWatchman();
      expect(preference).to.have.property('watcher', 'watchman');
      expect(ui.output).to.not.match(/Could not start watchman/);
      expect(ui.output).to.not.match(/falling back to NodeWatcher/);
      expect(ui.output).to.not.match(/ember-cli\.com\/user-guide\/\#watchman/);
      expect(ui.output).to.not.match(/Looks like you have a different program called watchman/);
      expect(ui.output).to.not.match(/Invalid watchman found/);
    });

    describe('fallse back to NODE', function() {
      let iff = it;

      iff('the exec rejects', function() {
        childProcess.execSync = function() {
          throw new Error();
        };

        let preference = subject.checkWatchman();
        expect(preference).to.have.property('watcher', 'node');
        expect(ui.output).to.match(/Could not start watchman/);
        expect(ui.output).to.match(/ember-cli\.com\/user-guide\/\#watchman/);
      });

      iff('the `watchman version` doesn\'t parse', function() {
        childProcess.execSync = function() {
          return 'not json';
        };

        let preference = subject.checkWatchman();
        expect(preference).to.have.property('watcher', 'node');
        expect(ui.output).to.match(/Looks like you have a different program called watchman/);
        expect(ui.output).to.match(/ember-cli\.com\/user-guide\/\#watchman/);
      });


      iff('the `watchman version` doesn\'t satisfy => 3.0.0', function() {
        childProcess.execSync = function() {
          return '{"version":"2.9.9"}';
        };

        let preference = subject.checkWatchman();
        expect(preference).to.have.property('watcher', 'node');
        expect(ui.output).to.match(/Invalid watchman found/);
        expect(ui.output).to.match(/version: \[2\.9\.9\] did not satisfy/);
        expect(ui.output).to.match(/ember-cli\.com\/user-guide\/\#watchman/);
      });
    });
  });
});
