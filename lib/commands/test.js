'use strict';

var assign    = require('lodash-node/modern/objects/assign');
var quickTemp = require('quick-temp');
var Command   = require('../command');

module.exports = new Command({
  aliases: ['test', 't'],

  availableOptions: [
    { name: 'config-file', type: String, default: './testem.json' },
  ],

  run: function(environment, options) {
    var bind        = this;
    var build       = environment.tasks.build;
    var test        = environment.tasks.test;
    var cwd         = quickTemp.makeOrRemake(bind, '-testsDist');
    var testOptions = assign({}, options);

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
});
