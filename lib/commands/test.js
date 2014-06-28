'use strict';

var assign    = require('lodash-node/modern/objects/assign');
var quickTemp = require('quick-temp');
var Command   = require('../models/command');
var Watcher   = require('../models/watcher');
var Builder   = require('../models/builder');

module.exports = Command.extend({
  name: 'test',
  aliases: ['test', 't'],
  description: 'Runs your apps test suite.',

  availableOptions: [
    { name: 'config-file', type: String,  default: './testem.json' },
    { name: 'server',      type: Boolean, default: false},
    { name: 'port',        type: Number,  default: 7357, description: 'The port to use when running with --server.'},
  ],

  tmp: function() {
    return quickTemp.makeOrRemake(this, '-testsDist');
  },

  rmTmp: function() {
    quickTemp.remove(this, '-testsDist');
  },

  run: function(commandOptions) {
    var outputPath  = this.tmp();
    var testOptions = assign({}, commandOptions, {outputPath: outputPath});

    var options = {
      ui: this.ui,
      analytics: this.analytics
    };

    if (commandOptions.server) {
      options.builder = new Builder({outputPath: outputPath});

      var TestServerTask = this.tasks.TestServer;
      var testServer     = new TestServerTask(options);

      testOptions.watcher = new Watcher(assign(options, {verbose: false}));

      return testServer.run(testOptions);
    } else {
      var TestTask  = this.tasks.Test;
      var BuildTask = this.tasks.Build;

      var test  = new TestTask(options);
      var build = new BuildTask(options);

      return build.run({
          environment: 'development',
          outputPath: outputPath
        })
        .then(function() {
          return test.run(testOptions);
        })
        .finally(this.rmTmp.bind(this));
    }
  }
});
