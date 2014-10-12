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
    { name: 'environment', type: String, default: 'test' },
    { name: 'config-file', type: String,  default: './testem.json' },
    { name: 'server',      type: Boolean, default: false},
    { name: 'port',        type: Number,  default: 7357, description: 'The port to use when running with --server.'},
    { name: 'filter',      type: String,  description: 'A regex to filter tests ran'},
    { name: 'watcher',     type: String,  default: 'events' },
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
    if (!options.filter) { return options.configFile; }

    var tmpPath = this.quickTemp.makeOrRemake(this, '-customConfigFile');
    var customPath = path.join(tmpPath, 'testem.json');
    var originalContents = JSON.parse(fs.readFileSync(options.configFile, { encoding: 'utf8' }));

    originalContents['test_page'] = originalContents['test_page'] + '?filter=' + options.filter;

    fs.writeFileSync(customPath, JSON.stringify(originalContents));

    return customPath;
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
