'use strict';

var Command   = require('../models/command');
var Watcher   = require('../models/watcher');
var Builder   = require('../models/builder');

var fs = require('fs');
var path = require('path');

module.exports = Command.extend({
  name: 'test',
  aliases: ['test', 't'],
  description: 'Runs your apps test suite.',

  availableOptions: [
    { name: 'environment', type: String, default: 'test', aliases: ['e'] },
    { name: 'config-file', type: String,  default: './testem.json', aliases: ['c', 'cf'] },
    { name: 'server',      type: Boolean, default: false, aliases: ['s'] },
    { name: 'port',        type: Number,  default: 7357, description: 'The port to use when running with --server.', aliases: ['p'] },
    { name: 'filter',      type: String,  description: 'A regex to filter tests ran', aliases: ['f'] },
    { name: 'module',      type: String,  description: 'The name of a test module to run', aliases: ['m'] },
    { name: 'watcher',     type: String,  default: 'events', aliases: ['w'] },
  ],

  init: function() {
    this.assign    = require('lodash-node/modern/objects/assign');
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
    if (!options.filter && !options.module) { return options.configFile; }

    var tmpPath = this.quickTemp.makeOrRemake(this, '-customConfigFile');
    var customPath = path.join(tmpPath, 'testem.json');
    var originalContents = JSON.parse(fs.readFileSync(options.configFile, { encoding: 'utf8' }));

    originalContents['test_page'] = originalContents['test_page'] + this.buildTestPageQueryString(options);
    fs.writeFileSync(customPath, JSON.stringify(originalContents));

    return customPath;
  },

  buildTestPageQueryString: function(options) {
    var params = [];

    if (options.module) {
      params.push('module=' + options.module);
    }

    if (options.filter) {
      params.push('filter=' + options.filter);
    }

    return params.length ? '?' + params.join('&') : '';
  },

  run: function(commandOptions) {
    var outputPath  = this.tmp();
    var testOptions = this.assign({}, commandOptions, {
      outputPath: outputPath,
      project: this.project,
      configFile: this._generateCustomConfigFile(commandOptions)
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
