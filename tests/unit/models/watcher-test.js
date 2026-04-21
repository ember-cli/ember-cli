'use strict';

const { expect } = require('chai');

const MockUI = require('console-ui/mock');
const MockBroccoliWatcher = require('../../helpers/mock-broccoli-watcher');
const Watcher = require('../../../lib/models/watcher');
const EOL = require('os').EOL;
const { default: chalk } = require('chalk');
const BuildError = require('../../helpers/build-error');

describe('Watcher', function () {
  let ui;
  let subject;
  let builder;
  let watcher;

  let mockResult = {
    totalTime: 12344000000,
    graph: {
      __heimdall__: {
        visitPreOrder(cb) {
          return cb({
            stats: {
              time: {
                self: 12344000000,
              },
            },
          });
        },
        visitPostOrder() {},
      },
    },
  };

  beforeEach(async function () {
    ui = new MockUI();

    watcher = new MockBroccoliWatcher();

    subject = (
      await Watcher.build({
        ui,
        builder,
        watcher,
      })
    ).watcher;
  });

  describe('watcher strategy selection', function () {
    it('selects the events-based watcher by default', function () {
      subject.options = null;

      expect(subject.buildOptions()).to.deep.equal({
        verbose: true,
        poll: false,
        watchman: false,
        node: false,
      });
    });

    it('selects the events-based watcher when given events watcher option', function () {
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

    it('selects the polling watcher when given polling watcher option', function () {
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

  describe('underlining watcher properly logs change events', function () {
    it('logs that the file was added', function () {
      watcher.emit('change', 'add', 'foo.txt');
      expect(ui.output).to.equal(`file added foo.txt${EOL}`);
    });
    it('logs that the file was changed', function () {
      watcher.emit('change', 'change', 'foo.txt');
      expect(ui.output).to.equal(`file changed foo.txt${EOL}`);
    });
    it('logs that the file was deleted', function () {
      watcher.emit('change', 'delete', 'foo.txt');
      expect(ui.output).to.equal(`file deleted foo.txt${EOL}`);
    });
  });

  describe(`watcher:buildSuccess`, function () {
    beforeEach(function () {
      watcher.emit(`buildSuccess`, mockResult);
    });

    it('logs that the build was successful', function () {
      expect(ui.output).to.equal(EOL + chalk.green('Build successful (12344ms)') + EOL);
    });
  });

  describe('output', function () {
    this.timeout(40000);

    it('with ssl', async function () {
      let subject = (
        await Watcher.build({
          ui,
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
        })
      ).watcher;

      subject.didChange(mockResult);

      let output = ui.output.trim().split(EOL);
      expect(output[0]).to.equal(`${chalk.green('Build successful (12344ms)')} – Serving on https://localhost:1337/`);
    });

    it('with rootURL', async function () {
      let subject = (
        await Watcher.build({
          ui,
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
        })
      ).watcher;

      subject.didChange(mockResult);

      let output = ui.output.trim().split(EOL);

      expect(output[0]).to.equal(
        `${chalk.green('Build successful (12344ms)')} – Serving on http://localhost:1337/foo/`
      );
      expect(output.length).to.equal(1, 'expected only one line of output');
    });

    it('with empty rootURL', async function () {
      let subject = (
        await Watcher.build({
          ui,
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
        })
      ).watcher;

      subject.didChange(mockResult);

      let output = ui.output.trim().split(EOL);
      expect(output[0]).to.equal(`${chalk.green('Build successful (12344ms)')} – Serving on http://localhost:1337/`);
      expect(output.length).to.equal(1, 'expected only one line of output');
    });

    it('with customURL', async function () {
      let subject = (
        await Watcher.build({
          ui,
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
        })
      ).watcher;
      subject.serveURL = function () {
        return `http://customurl.com/`;
      };
      subject.didChange(mockResult);

      let output = ui.output.trim().split(EOL);
      expect(output[0]).to.equal(`${chalk.green('Build successful (12344ms)')} – Serving on http://customurl.com/`);
    });
  });

  describe('watcher:error', function () {
    it('watcher error', function () {
      watcher.emit('error', {
        message: 'foo',
        stack: new Error().stack,
      });

      expect(ui.output).to.equal('');

      let outs = ui.errors.split(EOL);

      expect(outs[0]).to.equal(chalk.red('foo'));
    });

    it('watcher buildFailure', function () {
      watcher.emit('buildFailure', {
        isBuilderError: true,
        message: 'I am a build error',
        file: 'the-file.txt',
        stack: new Error().stack,
      });

      expect(ui.output).to.equal('');

      let outs = ui.errors.split(EOL);

      expect(outs[0]).to.equal(chalk.red('File: the-file.txt'));
      expect(outs[2]).to.equal(chalk.red('I am a build error'));
    });

    it('emits without error.file', function () {
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

    it('emits with error.file with error.line without err.col', function () {
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

    it('emits with error.file without error.line with err.col', function () {
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

    it('emits with error.file with error.line with err.col', function () {
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

  describe('watcher:change afterError', function () {
    beforeEach(function () {
      watcher.emit('error', {
        message: 'foo',
        stack: new Error().stack,
      });

      watcher.emit(`buildSuccess`, mockResult);
    });

    it('log that the build was green', function () {
      expect(ui.output).to.match(/Build successful./, 'has successful build output');
    });
  });
});
