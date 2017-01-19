'use strict';

const Command = require('../models/command');
const Watcher = require('../models/watcher');
const Builder = require('../models/builder');
const SilentError = require('silent-error');
const path = require('path');
const Win = require('../utilities/windows-admin');
const existsSync = require('exists-sync');
const assign = require('ember-cli-lodash-subset').assign;
let defaultPort = 7357;

module.exports = Command.extend({
  name: 'test',
  description: 'Runs your app\'s test suite.',
  aliases: ['t'],

  availableOptions: [
    { name: 'environment', type: String,  default: 'test',          aliases: ['e'],  description: 'Possible values are "development", "production", and "test".' },
    { name: 'config-file', type: String,                            aliases: ['c', 'cf'] },
    { name: 'server',      type: Boolean, default: false,           aliases: ['s'] },
    { name: 'host',        type: String,                            aliases: ['H'] },
    { name: 'test-port',   type: Number,  default: defaultPort,     aliases: ['tp'], description: 'The test port to use when running with --server. Pass 0 to automatically pick an available port' },
    { name: 'filter',      type: String,                            aliases: ['f'],  description: 'A string to filter tests to run' },
    { name: 'module',      type: String,                            aliases: ['m'],  description: 'The name of a test module to run' },
    { name: 'watcher',     type: String,  default: 'events',        aliases: ['w'] },
    { name: 'launch',      type: String,  default: false,                            description: 'A comma separated list of browsers to launch for tests.' },
    { name: 'reporter',    type: String,                            aliases: ['r'],  description: 'Test reporter to use [tap|dot|xunit] (default: tap)' },
    { name: 'silent',      type: Boolean, default: false,                            description: 'Suppress any output except for the test report' },
    { name: 'testem-debug', type: String,                                            description: 'File to write a debug log from testem' },
    { name: 'test-page',   type: String,                                             description: 'Test page to invoke' },
    { name: 'path',        type: 'Path',                                             description: 'Reuse an existing build at given path.' },
    { name: 'query',       type: String,                                             description: 'A query string to append to the test page URL.' },
  ],

  init() {
    this._super.apply(this, arguments);

    this.quickTemp = require('quick-temp');

    this.Builder = this.Builder || Builder;
    this.Watcher = this.Watcher || Watcher;

    if (!this.testing) {
      process.env.EMBER_CLI_TEST_COMMAND = true;
    }
  },

  tmp() {
    return this.quickTemp.makeOrRemake(this, '-testsDist');
  },

  rmTmp() {
    this.quickTemp.remove(this, '-testsDist');
    this.quickTemp.remove(this, '-customConfigFile');
  },

  _generateCustomConfigs(options) {
    let config = {};
    if (!options.filter && !options.module && !options.launch && !options.query && !options['test-page']) { return config; }

    let testPage = options['test-page'];
    let queryString = this.buildTestPageQueryString(options);
    if (testPage) {
      let containsQueryString = testPage.indexOf('?') > -1;
      let testPageJoinChar = containsQueryString ? '&' : '?';
      config.testPage = testPage + testPageJoinChar + queryString;
    }
    if (queryString) {
      config.queryString = queryString;
    }

    if (options.launch) {
      config.launch = options.launch;
    }

    return config;
  },

  _generateTestPortNumber(options) {
    if ((options.port && options.testPort !== defaultPort) || (!isNaN(parseInt(options.testPort)) && !options.port)) {
      return options.testPort;
    }

    if (options.port) {
      return parseInt(options.port, 10) + 1;
    }
  },

  buildTestPageQueryString(options) {
    let params = [];

    if (options.module) {
      params.push(`module=${options.module}`);
    }

    if (options.filter) {
      params.push(`filter=${options.filter.toLowerCase()}`);
    }

    if (options.query) {
      params.push(options.query);
    }

    return params.join('&');
  },

  run(commandOptions) {
    let hasBuild = !!commandOptions.path;
    let outputPath;

    if (hasBuild) {
      outputPath = path.resolve(commandOptions.path);

      if (!existsSync(outputPath)) {
        throw new SilentError(`The path ${commandOptions.path} does not exist. Please specify a valid build directory to test.`);
      }
    } else {
      outputPath = this.tmp();
    }

    process.env['EMBER_CLI_TEST_OUTPUT'] = outputPath;

    let testOptions = assign({}, commandOptions, {
      ui: this.ui,
      outputPath,
      project: this.project,
      port: this._generateTestPortNumber(commandOptions),
    }, this._generateCustomConfigs(commandOptions));

    let options = {
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
    };

    return Win.checkIfSymlinksNeedToBeEnabled(this.ui).then(() => {
      let session;

      if (commandOptions.server) {
        if (hasBuild) {
          throw new SilentError('Specifying a build is not allowed with the `--server` option.');
        }

        let TestServerTask = this.tasks.TestServer;
        let testServer = new TestServerTask(options);
        let builder = new this.Builder(testOptions);

        testOptions.watcher = new this.Watcher(assign(options, {
          builder,
          verbose: false,
          options: commandOptions,
        }));

        session = testServer.run(testOptions)
          .finally(() => builder.cleanup());

      } else {
        let TestTask = this.tasks.Test;
        let test = new TestTask(options);


        if (hasBuild) {
          session = test.run(testOptions);
        } else {
          let BuildTask = this.tasks.Build;
          let build = new BuildTask(options);

          session = build.run({
            environment: commandOptions.environment,
            outputPath,
          })
          .then(() => test.run(testOptions));
        }
      }

      return session.finally(this.rmTmp.bind(this));
    });
  },
});
