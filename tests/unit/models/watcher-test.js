'use strict';

var expect = require('chai').expect;

var MockUI = require('../../helpers/mock-ui');
var MockAnalytics = require('../../helpers/mock-analytics');
var MockWatcher  = require('../../helpers/mock-watcher');
var Watcher = require('../../../lib/models/watcher');
var EOL = require('os').EOL;
var chalk = require('chalk');
var BuildError = require('../../helpers/build-error');
var Promise = require('../../../lib/ext/promise');

describe('Watcher', function() {
  var ui;
  var subject;
  var builder;
  var analytics;
  var watcher;

  beforeEach(function() {
    ui        = new MockUI();
    analytics = new MockAnalytics();
    watcher   = new MockWatcher();

    subject = new Watcher({
      ui: ui,
      analytics: analytics,
      builder: builder,
      watcher: watcher
    });
  });

  describe('detectWatcher', function() {
    describe('explicit configuration', function() {
      it('it selects polling if explicitly configured', function() {
        return Watcher.detectWatcher(ui, { watcher: 'polling' }).then(function(result) {
          expect(result).to.eql({ watcher: 'polling' });
        })
      });

      it('it selects node if explicitly configured', function() {
        return Watcher.detectWatcher(ui, { watcher: 'node' }).then(function(result) {
          expect(result).to.eql({ watcher: 'node' });
        });
      });
    });

    describe('auto-detect', function() {
      describe('watchmen present', function() {
        it('warns and falls back to node when broken (invoking watchman results in non-zero exit code)', function() {
          function exec(command) {
            return Promise.reject();
          }

          return Watcher.detectWatcher(ui, {}, { exec }).then(function(result) {
            expect(result).to.eql({ watcher: 'node' });
            expect(ui.output).to.match(/Could not start watchman;/);
            expect(ui.output).to.match(/falling back to NodeWatcher/);
            expect(ui.output).to.match(/ember-cli.com\/user-guide\/#watchman/);
          });
        });;

        it('warns and falls back to node when broken (invoking watchman results in non-json output)', function() {
          function exec(command) {
            return Promise.resolve('this is not JSON');
          }

          return Watcher.detectWatcher(ui, {}, { exec }).then(function(result) {
            expect(result).to.eql({ watcher: 'node' });

            expect(ui.output).to.match(/Looks like you have a different program called watchman/);
            expect(ui.output).to.match(/falling back to NodeWatcher/);
            expect(ui.output).to.match(/ember-cli.com\/user-guide\/#watchman/);
          });
        });

        it('warns and falls back to node when version does not satisfy [>= 3.0.0]', function() {
          function exec(command) {
            return Promise.resolve('{"version": "2.9.9"}');
          }

          return Watcher.detectWatcher(ui, {}, { exec }).then(function(result) {
            expect(result).to.eql({ watcher: 'node' });

            expect(ui.output).to.match(/did not satisfy \[\>\= 3.0.0\]/);
            expect(ui.output).to.match(/falling back to NodeWatcher/);
            expect(ui.output).to.match(/ember-cli.com\/user-guide\/#watchman/);
          });
        });

        it('uses watchman valid version', function() {
          function exec(command) {
            return Promise.resolve('{"version": "3.0.0"}');
          }

          return Watcher.detectWatcher(ui, {}, { exec }).then(function(result) {
            expect(result).to.have.property('watcher', 'watchman');
          });
        });
      });

      it('it selects node if explicitly configured', function() {
        return Watcher.detectWatcher(ui, { watcher: 'node' }).then(function(result) {
          expect(result).to.eql({ watcher: 'node' });
        })
      });
    });
  });

  describe('watcher strategy selection', function() {
    it('selects the events-based watcher by default', function () {
      subject.options = null;

      expect(subject.buildOptions()).to.deep.equal({
        verbose: true,
        poll: false,
        watchman: false,
        node: false
      });
    });

    it('selects the events-based watcher when given events watcher option', function () {
      subject.options = {
        watcher: 'events'
      };

      expect(subject.buildOptions()).to.deep.equal({
        verbose: true,
        poll: false,
        watchman: true,
        node: false
      });
    });

    it('selects the polling watcher when given polling watcher option', function () {
      subject.options = {
        watcher: 'polling'
      };

      expect(subject.buildOptions()).to.deep.equal({
        verbose: true,
        poll: true,
        watchman: false,
        node: false
      });
    });
  });

  describe('watcher:change', function() {
    beforeEach(function() {
      watcher.emit('change', {
        totalTime: 12344000000
      });
    });

    it('tracks events', function() {
      expect(analytics.tracks).to.deep.equal([{
        name: 'ember rebuild',
        message: 'broccoli rebuild time: 12344ms'
      }]);
    });

    it('tracks timings', function() {
      expect(analytics.trackTimings).to.deep.equal([{
        category: 'rebuild',
        variable: 'rebuild time',
        label:    'broccoli rebuild time',
        value:    12344
      }]);
    });

    it('logs that the build was successful', function() {
      expect(ui.output).to.equal(EOL + chalk.green('Build successful - 12344ms.') + EOL);
    });
  });

  describe('watcher:error', function() {
    it('tracks errors', function() {
      watcher.emit('error', {
        message: 'foo',
        stack: new Error().stack
      });

      expect(analytics.trackErrors).to.deep.equal([{
        description: 'foo'
      }]);
    });

    it('emits without error.file', function() {
      subject.didError(new BuildError({
        file: 'someFile',
        message: 'buildFailed'
      }));

      expect(ui.output).to.equal('');

      var outs = ui.errors.split(EOL);

      expect(outs[0]).to.equal(chalk.red('File: someFile'));
      expect(outs[1]).to.equal(chalk.red('buildFailed'));
    });

    it('emits with error.file with error.line without err.col', function() {
      subject.didError(new BuildError({
        file: 'someFile',
        line: 24,
        message: 'buildFailed'
      }));

      expect(ui.output).to.eql('');

      var outs = ui.errors.split(EOL);

      expect(outs[0]).to.equal(chalk.red('File: someFile (24)'));
      expect(outs[1]).to.equal(chalk.red('buildFailed'));
    });

    it('emits with error.file without error.line with err.col', function() {
      subject.didError(new BuildError({
        file: 'someFile',
        col: 80,
        message: 'buildFailed'
      }));

      expect(ui.output).to.eql('');

      var outs = ui.errors.split(EOL);

      expect(outs[0]).to.equal(chalk.red('File: someFile'));
      expect(outs[1]).to.equal(chalk.red('buildFailed'));
    });

    it('emits with error.file with error.line with err.col', function() {
      subject.didError(new BuildError({
        file: 'someFile',
        line: 24,
        col: 80,
        message: 'buildFailed'
      }));

      expect(ui.output).to.eql('');

      var outs = ui.errors.split(EOL);

      expect(outs[0]).to.equal(chalk.red('File: someFile (24:80)'));
      expect(outs[1]).to.equal(chalk.red('buildFailed'));
    });
  });

  describe('watcher:change afterError', function() {
    beforeEach(function() {
      watcher.emit('error', {
        message: 'foo',
        stack: new Error().stack
      });

      watcher.emit('change', {
        totalTime: 12344000000
      });
    });

    it('log that the build was green', function() {
      expect(ui.output).to.match(/Build successful./, 'has successful build output');
    });

    it('keep tracking analytics', function() {
      expect(analytics.tracks).to.deep.equal([{
        name: 'ember rebuild',
        message: 'broccoli rebuild time: 12344ms'
      }]);
    });
  });
});
