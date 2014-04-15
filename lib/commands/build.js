'use strict';

var path    = require('path');
var Command = require('../command');

module.exports = new Command({
  availableOptions: [
    { name: 'environment', type: String, default: 'development' },
    { name: 'output-path', type: path, default: 'dist/' }
  ],

  run: function(ui, leek, environment, options) {
    return environment.tasks.build.run(ui, options);
  }
});
