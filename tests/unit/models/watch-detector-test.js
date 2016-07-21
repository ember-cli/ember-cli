'use strict';

var expect = require('chai').expect;

var MockUI = require('../../helpers/mock-ui');
var WatchDetector = require('../../../lib/models/watch-detector');
var EOL = require('os').EOL;
var chalk = require('chalk');
var Promise = require('../../../lib/ext/promise');

describe('WatchDetector', function() {
  var ui;
  var subject;
  var execArg, execValue;
  var fs, childProcess;

  beforeEach(function() {
    ui = new MockUI();

    fs =  {};
    childProcess = {};

    function exec(arg) {
      execArg = arg;
      return execValue;
    }

    subject = new WatchDetector({
      ui: ui,
      fs: fs,
      childProcess: childProcess,
      watchmanSupportsPlatform: false
    });
  });

  it('#extractPreferenceFromOptions works', function() {
    expect(subject.extractPreferenceFromOptions({})).to.have.property('watcher', 'watchman');
    expect(subject.extractPreferenceFromOptions({watcher: 'polling'})).to.have.property('watcher', 'polling');
    expect(subject.extractPreferenceFromOptions({watcher: 'node'})).to.have.property('watcher', 'node');
    expect(subject.extractPreferenceFromOptions({watcher: 'nodsdfe'})).to.have.property('watcher', 'watchman');
  });

  describe('#testIfNodeWatcherAppearsToWork', function() {
    it('reports YES if fs.watch throws', function() {
      fs.watch = function() {
        throw new Error('Something went wrong');
      }

      return subject.testIfNodeWatcherAppearsToWork().then(function(value) {
        expect(value).to.be.false;
      });
    });

    // we could extend this to test also if change events are triggered or not..
    it('reports NO if nothing throws', function() {
      fs.watch = function() { };

      return subject.testIfNodeWatcherAppearsToWork().then(function(value) {
        expect(value).to.be.false;
      });
    });
  });


  describe('#findBestWatcherOption', function() {
    describe('input preference.watcher === watchman', function() {
      beforeEach(function() {
        childProcess.exec = function() {
          return Promise.resolve('{"version":"3.0.0"}');
        };
      });

      it('chooses watchman', function() {
        return subject.findBestWatcherOption({ watcher: 'watchman' }).then(function(option) {
          expect(option).to.have.property('watcher', 'watchman');
          expect(option.watchmanInfo).to.have.property('version');
          expect(option.watchmanInfo).to.have.property('canNestRoots');
          expect(option.watchmanInfo).to.have.property('enabled', true)
          expect(ui.output).not.to.match(/Could not start watchman/);
          expect(ui.output).not.to.match(/fell back to: "node"/);
          expect(ui.output).not.to.match(/Visit http:\/\/ember-cli.com\/user-guide\/\#watchman/);
        });
      });

      describe('watchman does not work', function() {
        beforeEach(function() {
          childProcess.exec = function() {
            return Promise.reject();
          };
        });

        it('false back to node if it can', function() {
          fs.watch = function() {
            // no error
          };

          fs.unwatch = function() {
            // no error
          };

          return subject.findBestWatcherOption({ watcher: 'watchman' }).then(function(option) {
            expect(option.watchmanInfo).to.have.property('enabled', false)
            expect(option).to.have.property('watcher', 'node');
            expect(option.watchmanInfo).to.have.property('version');
            expect(option.watchmanInfo).to.have.property('canNestRoots');
            expect(ui.output).to.match(/Could not start watchman/);
            expect(ui.output).to.match(/fell back to: "node"/);
            expect(ui.output).to.match(/Visit http:\/\/ember-cli.com\/user-guide\/\#watchman/);
          });
        });

        it('false back to polling if node does not work', function() {
          fs.watch = function() {
            throw new Error('something went wrong');
          };

          return subject.findBestWatcherOption({ watcher: 'watchman' }).then(function(option) {
            expect(option).to.have.property('watcher', 'polling');
            expect(option.watchmanInfo).to.have.property('enabled', false)
            expect(option.watchmanInfo).to.have.property('version');
            expect(option.watchmanInfo).to.have.property('canNestRoots');
            expect(ui.output).to.match(/Could not start watchman/);
            expect(ui.output).to.match(/fell back to: "polling"/);
            expect(ui.output).to.match(/Visit http:\/\/ember-cli.com\/user-guide\/\#watchman/);
          });
        });
      });
    });

    describe('input preference.watcher === polling', function() {
      it('simply works', function() {
        // we assuming polling can never not work, if it doesn't sorry..
        return subject.findBestWatcherOption({ watcher: 'polling' }).then(function(option) {
          expect(option.watchmanInfo).to.have.property('enabled', false)
          expect(option).to.have.property('watcher', 'polling');
          expect(ui.output).to.eql('');
        });
      })
    });

    describe('input preference.watcher === node', function() {
      it('chooses node, if everyint seems ok', function() {
        fs.watch = function() { };
        fs.unwatch = function() { };

        // we assuming polling can never not work, if it doesn't sorry..
        return subject.findBestWatcherOption({ watcher: 'node' }).then(function(option) {
          expect(option).to.have.property('watcher', 'node');
          expect(ui.output).to.eql('');
        });
      });

      it('false back to polling if watch fails', function() {
        fs.watch = function() {
          throw new Error('OMG');
        };
        fs.unwatch = function() {
        };
        // we assuming polling can never not work, if it doesn't sorry..
        return subject.findBestWatcherOption({ watcher: 'node' }).then(function(option) {
          expect(option).to.have.property('watcher', 'polling');
          expect(ui.output).to.eql('was unable to use: "node", fell back to: "polling"' + EOL);
        });
      });

      it('falls back to polling if unwatch fails', function() {
        fs.watch = function() {
          // works
        };
        fs.unwatch = function() {
          throw new Error('OMG');
        };
        // we assuming polling can never not work, if it doesn't sorry..
        return subject.findBestWatcherOption({ watcher: 'node' }).then(function(option) {
          expect(option).to.have.property('watcher', 'polling');
          expect(ui.output).to.eql('was unable to use: "node", fell back to: "polling"' + EOL);
        });
      })
    });

  });

  describe('#checkWatchman', function() {
    describe('watchmanSupportsPlatform', function() {
      it('true: hides the "watchman not found, falling back to XYZ message"', function() {
        subject.watchmanSupportsPlatform = true;

        childProcess.exec = function() {
          return Promise.reject();
        };
        fs.watch = function() {};
        fs.unwatch = function() {};

        return subject.checkWatchman().then(function(result) {
          expect(result).to.have.property('watcher', 'node');
          expect(ui.output).to.eql('');
        });
      });

      it('false: shows the "watchman not found, falling back to XYZ message"', function() {
        subject.watchmanSupportsPlatform = false;

        childProcess.exec = function() {
          return Promise.reject();
        };
        fs.watch = function() {};
        fs.unwatch = function() {};

        return subject.checkWatchman().then(function(result) {
          expect(result).to.have.property('watcher', 'node');
          expect(ui.output).to.match(/Could not start watchman/);
          expect(ui.output).to.match(/Visit http:\/\/ember-cli.com\/user-guide\/\#watchman/);
        });
      });
    });
    it('prefers watchman if everything appears to be good', function() {
      childProcess.exec = function() {
        return Promise.resolve('{"version":"3.0.0"}');
      };

      return subject.checkWatchman().then(function(preference) {
        expect(preference).to.have.property('watcher', 'watchman');
        expect(ui.output).to.not.match(/Could not start watchman/);
        expect(ui.output).to.not.match(/falling back to NodeWatcher/);
        expect(ui.output).to.not.match(/ember-cli\.com\/user-guide\/\#watchman/);
        expect(ui.output).to.not.match(/Looks like you have a different program called watchman/);
        expect(ui.output).to.not.match(/Invalid watchman found/);
      });
    });

    describe('fallse back to NODE', function() {
      var iff = it;

      iff('the exec rejects', function() {
        childProcess.exec = function() {
          return Promise.reject();
        };

        return subject.checkWatchman().then(function(preference) {
          expect(preference).to.have.property('watcher', 'node');
          expect(ui.output).to.match(/Could not start watchman/);
          expect(ui.output).to.match(/ember-cli\.com\/user-guide\/\#watchman/);
        });
      });

      iff('the `watchman version` doesn\'t parse', function() {
        childProcess.exec = function() {
          return Promise.resolve("not json");
        };

        return subject.checkWatchman().then(function(preference) {
          expect(preference).to.have.property('watcher', 'node');
          expect(ui.output).to.match(/Looks like you have a different program called watchman/);
          expect(ui.output).to.match(/ember-cli\.com\/user-guide\/\#watchman/);
        });
      });


      iff('the `watchman version` doesn\'t satisfy => 3.0.0', function() {
        childProcess.exec = function() {
          return Promise.resolve('{"version":"2.9.9"}');
        };

        return subject.checkWatchman().then(function(preference) {
          expect(preference).to.have.property('watcher', 'node');
          expect(ui.output).to.match(/Invalid watchman found/);
          expect(ui.output).to.match(/version: \[2\.9\.9\] did not satisfy/);
          expect(ui.output).to.match(/ember-cli\.com\/user-guide\/\#watchman/);
        });
      });
    });
  });
});
