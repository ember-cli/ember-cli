'use strict';

var Command     = require('../models/command');
var Promise     = require('../ext/promise');
var SilentError = require('../errors/silent');

module.exports = Command.extend({
  name: 'install',
  description: 'Installs npm and bower packages.',
  works: 'insideProject',

  run: function(commandOptions, rawArgs) {
    if (rawArgs.length) {
      var err = new SilentError('The `install` command does not take any arguments. You must use `install:npm` or `install:bower` to install a specific package.');
      return Promise.reject(err);
    }

    var BowerInstallTask = this.tasks.BowerInstall;
    var bowerInstall     = new BowerInstallTask({
      ui:         this.ui,
      analytics:  this.analytics,
      project:    this.project
    });

    var NpmInstallTask = this.tasks.NpmInstall;
    var npmInstall     = new NpmInstallTask({
      ui:         this.ui,
      analytics:  this.analytics,
      project:    this.project
    });

    return bowerInstall.run({}).then(function() {
      return npmInstall.run({});
    });
  }
});
