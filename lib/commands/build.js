'use strict';

var path    = require('path');
var Command = require('../command');

module.exports = new Command({
  availableOptions: [
    { name: 'environment', type: String, default: 'development' },
    { name: 'output-path', type: path, default: 'dist/' }
  ],

  run: function(environment, options) {
    environment.tasks.build.ui   = this.ui;
    environment.tasks.build.leek = this.leek;

    return environment.tasks.build.run(options);
  }
});
