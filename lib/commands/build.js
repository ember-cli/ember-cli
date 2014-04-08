'use strict';

var chalk   = require('chalk');
var path    = require('path');
var Command = require('../command');

module.exports = new Command({
  filename: __filename,
  availableOptions: [
    { name: 'output-path', type: path, default: 'dist/' }
  ],

  run: function(environment, options) {
    return environment.tasks.build.run(environment, options);
  },

  usageInstructions: function() {
    return 'ember build ' + chalk.yellow('<env-name>') + ' ' +
                          chalk.green('[default: development] [optional: target path]');
  }
});
