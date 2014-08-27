'use strict';

var Command   = require('../models/command');
var Watcher   = require('../models/watcher');
var Builder   = require('../models/builder');

module.exports = Command.extend({
  name: 'test',
  aliases: ['test', 't'],
  description: 'Runs your apps test suite.',

  availableOptions: [
    { name: 'environment', type: String, default: 'test' },
    { name: 'config-file', type: String,  default: './testem.json' },
    { name: 'server',      type: Boolean, default: false},
    { name: 'port',        type: Number,  default: 7357, description: 'The port to use when running with --server.'},
  ],

  init: function() {
    this.assign    = require('lodash-node/modern/objects/assign');
    this.quickTemp = require('quick-temp');

    if (!this.testing) {
      process.env.EMBER_CLI_TEST_COMMAND = true;
    }
  },

  tmp: function() {
    return this.quickTemp.makeOrRemake(this, '-testsDist');
  },

  rmTmp: function() {
    this.quickTemp.remove(this, '-testsDist');
  },

  run: function(commandOptions) {
    var outputPath  = this.tmp();
    var testOptions = this.assign({}, commandOptions, {
      outputPath: outputPath,
      project: this.project
    });

    var options = {
      ui: this.ui,
      analytics: this.analytics,
      project: this.project
    };

    if (commandOptions.server) {
      options.builder = new Builder(testOptions);

      var TestServerTask = this.tasks.TestServer;
      var testServer     = new TestServerTask(options);

      testOptions.watcher = new Watcher(this.assign(options, {verbose: false}));

      return testServer.run(testOptions);
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
