'use strict';

// Runs `bower` commands(install, uninstall, cache clean...) in cwd

var BowerTask    = require('./bower-task');

module.exports = BowerTask.extend({
  command: 'install',
  startProgressMessage: 'Installing browser packages via Bower',
  completionMessage: 'Installed browser packages via Bower.',

  buildOptions: function(options) {
    return options.installOptions || { save: true };
  },

  buildArgs: function(options) {
    return options.packages || [];
  }
});
