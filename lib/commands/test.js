'use strict';

var assign    = require('lodash-node/modern/objects/assign');
var quickTemp = require('quick-temp');
var Command   = require('../command');

var buildWatcher = require('../utilities/build-watcher');

module.exports = new Command({
  aliases: ['test', 't'],

  availableOptions: [
    { name: 'config-file', type: String,  default: './testem.json' },
    { name: 'server',      type: Boolean, default: false},
  ],

  run: function(environment, options) {
    var bind        = this;
    var cwd         = quickTemp.makeOrRemake(bind, '-testsDist');
    var testOptions = assign({}, options);


    if (options.server) {
      var testServer  = environment.tasks.testServer;

      testServer.ui       = this.ui;
      testServer.leek     = this.leek;
      testOptions.watcher = buildWatcher();

      return testServer.run(testOptions);
    } else {
      var test        = environment.tasks.test;
      var build       = environment.tasks.build;

      build.ui   = this.ui;
      build.leek = this.leek;
      test.ui    = this.ui;
      test.leek  = this.leek;

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
