'use strict';

var chalk = require('chalk');
var path = require('path');

module.exports = {
  options: [
    { name: 'output-path', type: path, default: 'dist/' }
  ],

  run: function(environment, options) {
    return environment.tasks.build.run(environment, options);
  },

  usageInstructions: function() {
    return 'ember build ' + chalk.yellow('<env-name>') + ' ' +
                          chalk.green('[default: development] [optional: target path]');
  }
};
