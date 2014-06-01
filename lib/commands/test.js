'use strict';

var assign    = require('lodash-node/modern/objects/assign');
var quickTemp = require('quick-temp');
var Command   = require('../models/command');
var Watcher   = require('../models/watcher');
var Builder   = require('../models/builder');

module.exports = Command.extend({
  name: 'test',
  aliases: ['test', 't'],

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
    var testOptions = assign({}, commandOptions);

    var options = {
      ui: this.ui,
      analytics: this.analytics
    };

    if (commandOptions.server) {
      testOptions.liveOutputDir = options.liveOutputDir = this.tmp();
      options.builder = new Builder(options);

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
        outputPath: this.tmp()
      })
        .then(function() {
          return test.run(testOptions);
        })
        .finally(this.rmTmp.bind(this));
    }
  }
});
