'use strict';

const expect = require('chai').expect;

const MockUI = require('console-ui/mock');
const MockAnalytics = require('../../helpers/mock-analytics');
const MockWatcher = require('../../helpers/mock-watcher');
const Watcher = require('../../../lib/models/watcher');
const EOL = require('os').EOL;
const chalk = require('chalk');
const BuildError = require('../../helpers/build-error');

describe('Watcher', function() {
  let ui;
  let subject;
  let builder;
  let analytics;
  let watcher;

  beforeEach(function() {
    ui = new MockUI();
    analytics = new MockAnalytics();
    watcher = new MockWatcher();

    subject = new Watcher({
      ui,
      analytics,
      builder,
      watcher,
    });
  });

  describe('watcher strategy selection', function() {
    it('selects the events-based watcher by default', function() {
      subject.options = null;

      expect(subject.buildOptions()).to.deep.equal({
        verbose: true,
        poll: false,
        watchman: false,
        node: false,
      });
    });

    it('selects the events-based watcher when given events watcher option', function() {
      subject.options = {
        watcher: 'events',
      };

      expect(subject.buildOptions()).to.deep.equal({
        verbose: true,
        poll: false,
        watchman: true,
        node: false,
      });
    });

    it('selects the polling watcher when given polling watcher option', function() {
      subject.options = {
        watcher: 'polling',
      };

      expect(subject.buildOptions()).to.deep.equal({
        verbose: true,
        poll: true,
        watchman: false,
        node: false,
      });
    });
  });

  describe('watcher:change', function() {
    beforeEach(function() {
      watcher.emit('change', {
        totalTime: 12344000000,
      });
    });

    it('tracks events', function() {
      expect(analytics.tracks).to.deep.equal([
        {
          name: 'ember rebuild',
          message: 'broccoli rebuild time: 12344ms',
        },
      ]);
    });

    it('tracks timings', function() {
      expect(analytics.trackTimings).to.deep.equal([
        {
          category: 'rebuild',
          variable: 'rebuild time',
          label: 'broccoli rebuild time',
          value: 12344,
        },
      ]);
    });

    it('logs that the build was successful', function() {
      expect(ui.output).to.equal(EOL + chalk.green('Build successful (12344ms)') + EOL);
    });
  });

  describe('output', function() {
    this.timeout(40000);

    beforeEach(function() {
      ui = new MockUI();
      analytics = new MockAnalytics();
      watcher = new MockWatcher();
    });

    it('with ssl', function() {
      let subject = new Watcher({
        ui,
        analytics,
        builder,
        watcher,
        serving: true,
        options: {
          host: undefined,
          port: '1337',
          ssl: true,
          sslCert: 'tests/fixtures/ssl/server.crt',
          sslKey: 'tests/fixtures/ssl/server.key',
          environment: 'development',
          project: {
            config() {
              return {
                rootURL: '/',
              };
            },
          },
        },
      });

      subject.didChange({
        totalTime: 12344000000,
      });

      let output = ui.output.trim().split(EOL);
      expect(output[0]).to.equal(`${chalk.green('Build successful (12344ms)')} – Serving on https://localhost:1337/`);
    });

    it('with baseURL', function() {
      let subject = new Watcher({
        ui,
        analytics,
        builder,
        watcher,
        serving: true,
        options: {
          host: undefined,
          port: '1337',
          environment: 'development',
          project: {
            config() {
              return {
                baseURL: '/foo',
              };
            },
          },
        },
      });

      subject.didChange({
        totalTime: 12344000000,
      });

      let output = ui.output.trim().split(EOL);
      expect(output[0]).to.equal(
        `${chalk.green('Build successful (12344ms)')} – Serving on http://localhost:1337/foo/`
      );
      expect(output.length).to.equal(1, 'expected only one line of output');
    });

    it('with rootURL', function() {
      let subject = new Watcher({
        ui,
        analytics,
        builder,
        watcher,
        serving: true,
        options: {
          host: undefined,
          port: '1337',
          environment: 'development',
          project: {
            config() {
              return {
                rootURL: '/foo',
              };
            },
          },
        },
      });

      subject.didChange({
        totalTime: 12344000000,
      });

      let output = ui.output.trim().split(EOL);

      expect(output[0]).to.equal(
        `${chalk.green('Build successful (12344ms)')} – Serving on http://localhost:1337/foo/`
      );
      expect(output.length).to.equal(1, 'expected only one line of output');
    });

    it('with empty rootURL', function() {
      let subject = new Watcher({
        ui,
        analytics,
        builder,
        watcher,
        serving: true,
        options: {
          host: undefined,
          port: '1337',
          rootURL: '',
          environment: 'development',
          project: {
            config() {
              return {
                rootURL: '',
              };
            },
          },
        },
      });

      subject.didChange({
        totalTime: 12344000000,
      });

      let output = ui.output.trim().split(EOL);
      expect(output[0]).to.equal(`${chalk.green('Build successful (12344ms)')} – Serving on http://localhost:1337/`);
      expect(output.length).to.equal(1, 'expected only one line of output');
    });

    it('with customURL', function() {
      let subject = new Watcher({
        ui,
        analytics,
        builder,
        watcher,
        serving: true,
        options: {
          host: undefined,
          port: '1337',
          rootURL: '',
          environment: 'development',
          project: {
            config() {
              return {
                rootURL: '',
              };
            },
          },
        },
      });
      subject.serveURL = function() {
        return `http://customurl.com/`;
      };
      subject.didChange({
        totalTime: 12344000000,
      });

      let output = ui.output.trim().split(EOL);
      expect(output[0]).to.equal(`${chalk.green('Build successful (12344ms)')} – Serving on http://customurl.com/`);
    });
  });

  describe('watcher:error', function() {
    it('tracks errors', function() {
      watcher.emit('error', {
        message: 'foo',
        stack: new Error().stack,
      });

      expect(analytics.trackErrors).to.deep.equal([
        {
          description: undefined,
        },
      ]);
    });

    it('emits without error.file', function() {
      subject.didError(
        new BuildError({
          file: 'someFile',
          message: 'buildFailed',
        })
      );

      expect(ui.output).to.equal('');

      let outs = ui.errors.split(EOL);

      expect(outs[0]).to.equal(chalk.red('File: someFile'));
      expect(outs[2]).to.equal(chalk.red('buildFailed'));
    });

    it('emits with error.file with error.line without err.col', function() {
      subject.didError(
        new BuildError({
          file: 'someFile',
          line: 24,
          message: 'buildFailed',
        })
      );

      expect(ui.output).to.eql('');

      let outs = ui.errors.split(EOL);

      expect(outs[0]).to.equal(chalk.red('File: someFile:24'));
      expect(outs[2]).to.equal(chalk.red('buildFailed'));
    });

    it('emits with error.file without error.line with err.col', function() {
      subject.didError(
        new BuildError({
          file: 'someFile',
          col: 80,
          message: 'buildFailed',
        })
      );

      expect(ui.output).to.eql('');

      let outs = ui.errors.split(EOL);

      expect(outs[0]).to.equal(chalk.red('File: someFile'));
      expect(outs[2]).to.equal(chalk.red('buildFailed'));
    });

    it('emits with error.file with error.line with err.col', function() {
      subject.didError(
        new BuildError({
          file: 'someFile',
          line: 24,
          col: 80,
          message: 'buildFailed',
        })
      );

      expect(ui.output).to.eql('');

      let outs = ui.errors.split(EOL);

      expect(outs[0]).to.equal(chalk.red('File: someFile:24:80'));
      expect(outs[2]).to.equal(chalk.red('buildFailed'));
    });
  });

  describe('watcher:change afterError', function() {
    beforeEach(function() {
      watcher.emit('error', {
        message: 'foo',
        stack: new Error().stack,
      });

      watcher.emit('change', {
        totalTime: 12344000000,
      });
    });

    it('log that the build was green', function() {
      expect(ui.output).to.match(/Build successful./, 'has successful build output');
    });

    it('keep tracking analytics', function() {
      expect(analytics.tracks).to.deep.equal([
        {
          name: 'ember rebuild',
          message: 'broccoli rebuild time: 12344ms',
        },
      ]);
    });
  });
});
