'use strict';

var assign  = require('lodash-node/modern/objects/assign');
var quickTemp = require('quick-temp');
var Command = require('../command');

module.exports = new Command({
  aliases: ['test', 't'],

  availableOptions: [
    { name: 'config-file', type: String, default: './testem.json' },
  ],

  run: function(ui, environment, options) {
    var build = environment.tasks.build;
    var test = environment.tasks.test;
    var cwd = quickTemp.makeOrRemake(this, '-testsDist');

    var testOptions = assign({}, options, { cwd: cwd });

    return build.run(ui, { environment: 'development', outputPath: cwd })
      .then(function() {
        return test.run(ui, testOptions);
      });
  }
});
