'use strict';

const Command = require('../models/command');
const Watcher = require('../models/watcher');
const Builder = require('../models/builder');
const SilentError = require('silent-error');
const path = require('path');
const Win = require('../utilities/windows-admin');
const fs = require('fs');
const temp = require('temp');
const util = require('util');
const PortFinder = require('portfinder');
let getPort = util.promisify(PortFinder.getPort);

temp.track();

let defaultPort = 7357;

module.exports = Command.extend({
  name: 'test',
  description: "Runs your app's test suite.",
  aliases: ['t'],

  availableOptions: [
    {
      name: 'environment',
      type: String,
      default: 'test',
      aliases: ['e'],
      description: 'Possible values are "development", "production", and "test".',
    },
    { name: 'config-file', type: String, aliases: ['c', 'cf'] },
    { name: 'server', type: Boolean, default: false, aliases: ['s'] },
    { name: 'host', type: String, aliases: ['H'] },
    {
      name: 'test-port',
      type: Number,
      default: defaultPort,
      aliases: ['tp'],
      description: 'The test port to use when running tests. Pass 0 to automatically pick an available port',
    },
    { name: 'filter', type: String, aliases: ['f'], description: 'A string to filter tests to run' },
    { name: 'module', type: String, aliases: ['m'], description: 'The name of a test module to run' },
    { name: 'watcher', type: String, default: 'events', aliases: ['w'] },
    {
      name: 'launch',
      type: String,
      default: false,
      description: 'A comma separated list of browsers to launch for tests.',
    },
    {
      name: 'reporter',
      type: String,
      aliases: ['r'],
      description: 'Test reporter to use [tap|dot|xunit] (default: tap)',
    },
    { name: 'silent', type: Boolean, default: false, description: 'Suppress any output except for the test report' },
    {
      name: 'ssl',
      type: Boolean,
      default: false,
      description: 'Set to true to configure testem to run the test suite using SSL.',
    },
    {
      name: 'ssl-key',
      type: String,
      default: 'ssl/server.key',
      description: 'Specify the private key to use for SSL.',
    },
    {
      name: 'ssl-cert',
      type: String,
      default: 'ssl/server.crt',
      description: 'Specify the certificate to use for SSL.',
    },
    { name: 'testem-debug', type: String, description: 'File to write a debug log from testem' },
    { name: 'test-page', type: String, description: 'Test page to invoke' },
    { name: 'path', type: 'Path', description: 'Reuse an existing build at given path.' },
    { name: 'query', type: String, description: 'A query string to append to the test page URL.' },
    { name: 'output-path', type: 'Path', aliases: ['o'] },
  ],

  init() {
    this._super.apply(this, arguments);

    // Make sure Testem supports the Wasm MIME type:
    require('express').static.mime.define({ 'application/wasm': ['wasm'] });

    this.Builder = this.Builder || Builder;
    this.Watcher = this.Watcher || Watcher;

    if (!this.testing) {
      process.env.EMBER_CLI_TEST_COMMAND = true;
    }
  },

  tmp() {
    return temp.mkdirSync('tests-dist-');
  },

  _generateCustomConfigs(options) {
    let config = {};
    if (!options.filter && !options.module && !options.launch && !options.query && !options['test-page']) {
      return config;
    }

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

  async _generateTestPortNumber(options, ui) {
    if (options.testPort === defaultPort && !options.port) {
      let foundPort = await getPort({ port: options.testPort });

      if (options.testPort !== foundPort) {
        ui.writeInfoLine(`Default port ${options.testPort} is already in use. Using alternate port ${foundPort}`);
      }

      return foundPort;
    }

    let port = parseInt(options.testPort, 10);
    if ((options.port && options.testPort !== defaultPort) || (!isNaN(parseInt(options.testPort)) && !options.port)) {
      port = parseInt(options.testPort, 10);
    } else if (options.port) {
      port = parseInt(options.port, 10) + 1;
    }

    return port;
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

  async run(commandOptions) {
    let hasBuild = !!commandOptions.path;
    let outputPath;

    if (hasBuild) {
      outputPath = path.resolve(commandOptions.path);

      if (!fs.existsSync(outputPath)) {
        throw new SilentError(
          `The path ${commandOptions.path} does not exist. Please specify a valid build directory to test.`
        );
      }
    } else {
      outputPath = commandOptions.outputPath || this.tmp();
    }

    process.env['EMBER_CLI_TEST_OUTPUT'] = outputPath;

    let testOptions = Object.assign(
      {},
      commandOptions,
      {
        ui: this.ui,
        outputPath,
        project: this.project,
        port: await this._generateTestPortNumber(commandOptions, this.ui),
      },
      this._generateCustomConfigs(commandOptions)
    );

    await Win.checkIfSymlinksNeedToBeEnabled(this.ui);
    let session;
    if (commandOptions.server) {
      if (hasBuild) {
        session = this.runTask('TestServer', testOptions);
      } else {
        let builder = new this.Builder(testOptions);
        testOptions.watcher = (
          await this.Watcher.build(
            Object.assign(this._env(), {
              builder,
              verbose: false,
              options: commandOptions,
            })
          )
        ).watcher;
        session = this.runTask('TestServer', testOptions).finally(() => builder.cleanup());
      }
    } else if (hasBuild) {
      session = this.runTask('Test', testOptions);
    } else {
      await this.runTask('Build', {
        environment: commandOptions.environment,
        outputPath,
      });
      session = await this.runTask('Test', testOptions);
    }
    return session;
  },
});
