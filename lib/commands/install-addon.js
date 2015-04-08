'use strict';

var InstallCommand = require('./install');
var chalk          = require('chalk');

module.exports = InstallCommand.extend({
  name: 'install:addon',
  description: 'This command has been deprecated. Please use `ember install` instead.',
  works: 'insideProject',

  anonymousOptions: [
    '<addon-name>'
  ],

  init: function() {
    var warning  = 'This command has been deprecated. Please use `ember ';
    warning     += 'install <addonName>` instead.';
    this.ui.writeLine(chalk.red(warning));

    if (this._super.init) {
      this._super.init.call(this);
    }
  }
});
