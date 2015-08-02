'use strict';

var Command   = require('../models/command');
var Watcher   = require('../models/watcher');
var Builder   = require('../models/builder');

var fs = require('fs');
var path = require('path');

var defaultPortNumber = 7357;

module.exports = Command.extend({
  name: 'test',
  aliases: ['test', 't'],
  description: 'Runs your app\'s test suite.',

  availableOptions: [
    { name: 'environment', type: String, default: 'test', aliases: ['e'] },
    { name: 'config-file', type: String,  default: './testem.json', aliases: ['c', 'cf'] },
    { name: 'server',      type: Boolean, default: false, aliases: ['s'] },
    { name: 'host',        type: String,  aliases: ['H'] },
    { name: 'test-port',   type: Number,  default: defaultPortNumber, description: 'The test port to use when running with --server.', aliases: ['tp'] },
    { name: 'filter',      type: String,  description: 'A string to filter tests to run', aliases: ['f'] },
    { name: 'module',      type: String,  description: 'The name of a test module to run', aliases: ['m'] },
    { name: 'watcher',     type: String,  default: 'events', aliases: ['w'] },
    { name: 'launch',      type: String,  default: false, description: 'A comma separated list of browsers to launch for tests.' },
    { name: 'reporter',    type: String,  description: 'Test reporter to use [tap|dot|xunit]', aliases: ['r']},
    { name: 'test-page',   type: String,  description: 'Test page to invoke'}
  ],

  init: function() {
    this.assign    = require('lodash/object/assign');
    this.quickTemp = require('quick-temp');

    this.Builder = this.Builder || Builder;
    this.Watcher = this.Watcher || Watcher;


    if (!this.testing) {
      process.env.EMBER_CLI_TEST_COMMAND = true;
    }
  },

  tmp: function() {
    return this.quickTemp.makeOrRemake(this, '-testsDist');
  },

  rmTmp: function() {
    this.quickTemp.remove(this, '-testsDist');
    this.quickTemp.remove(this, '-customConfigFile');
  },

  _generateCustomConfigFile: function(options) {
    if (!options.filter && !options.module && !options.launch && !options['test-page']) { return options.configFile; }

    var tmpPath = this.quickTemp.makeOrRemake(this, '-customConfigFile');
    var customPath = path.join(tmpPath, 'testem.json');
    var originalContents = JSON.parse(fs.readFileSync(options.configFile, { encoding: 'utf8' }));

    var testPage = options['test-page']?options['test-page']:originalContents['test_page'];

    var containsQueryString = testPage.indexOf('?') > -1;
    var testPageJoinChar    = containsQueryString ? '&' : '?';

    originalContents['test_page'] = testPage + testPageJoinChar + this.buildTestPageQueryString(options);
    if (options.launch) {
      originalContents['launch'] = options.launch;
    }
    fs.writeFileSync(customPath, JSON.stringify(originalContents));

    return customPath;
  },

  _generateTestPortNumber: function(options) {
    if (options.port && options.testPort !== defaultPortNumber || options.testPort && !options.port) { return options.testPort; }
    if (options.port) { return parseInt(options.port, 10) + 1; }
  },

  buildTestPageQueryString: function(options) {
    var params = [];

    if (options.module) {
      params.push('module=' + options.module);
    }

    if (options.filter) {
      params.push('filter=' + options.filter.toLowerCase());
    }

    return params.join('&');
  },

  run: function(commandOptions) {
    var outputPath  = this.tmp();
    process.env['EMBER_CLI_TEST_OUTPUT'] = outputPath;
    var testOptions = this.assign({}, commandOptions, {
      outputPath: outputPath,
      project: this.project,
      configFile: this._generateCustomConfigFile(commandOptions),
      port: this._generateTestPortNumber(commandOptions)
    });

    var options = {
      ui: this.ui,
      analytics: this.analytics,
      project: this.project
    };

    if (commandOptions.server) {
      options.builder = new this.Builder(testOptions);

      var TestServerTask = this.tasks.TestServer;
      var testServer     = new TestServerTask(options);

      testOptions.watcher = new this.Watcher(this.assign(options, {
        verbose: false,
        options: commandOptions
      }));

      return testServer.run(testOptions)
        .finally(this.rmTmp.bind(this));
    } else {
      var TestTask  = this.tasks.Test;
      var BuildTask = this.tasks.Build;

      var test  = new TestTask(options);
      var build = new BuildTask(options);

      return build.run({
          environment: commandOptions.environment,
          outputPath: outputPath
        })
        .then(function() {
          return test.run(testOptions);
        })
        .finally(this.rmTmp.bind(this));
    }
  }
});
