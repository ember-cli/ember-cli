'use strict';

var assign    = require('lodash-node/modern/objects/assign');
var quickTemp = require('quick-temp');
var Command   = require('../models/command');

var buildWatcher = require('../utilities/build-watcher');

module.exports = Command.extend({
  aliases: ['test', 't'],

  availableOptions: [
    { name: 'config-file', type: String,  default: './testem.json' },
    { name: 'server',      type: Boolean, default: false},
  ],

  run: function(commandOptions) {
    var bind        = this;
    var cwd         = quickTemp.makeOrRemake(bind, '-testsDist');
    var testOptions = assign({}, commandOptions);


    if (commandOptions.server) {
      var TestServerTask = this.tasks.TestServer;
      var testServer  = new TestServerTask({
        ui: this.ui,
        analytics: this.analytics
      });

      testOptions.watcher = buildWatcher();

      return testServer.run(testOptions);
    } else {
      var TestTask = this.tasks.Test;
      var test = new TestTask({
        ui: this.ui,
        analytics: this.analytics
      });
      var BuildTask = this.tasks.Build;
      var build = new BuildTask({
        ui: this.ui,
        analytics: this.analytics
      });

      return build.run({ environment: 'development', outputPath: cwd })
        .then(function() {
          return test.run(testOptions);
        })
        .finally(function() {
          quickTemp.remove(bind, '-testsDist');
        });
    }
  }
});
