'use strict';

// Runs `npm install` in cwd

var NpmTask = require('./npm-task');
var _ = require('lodash');

module.exports = NpmTask.extend({
  command: 'install',
  startProgressMessage: 'Installing packages for tooling via npm',
  completionMessage: 'Installed packages for tooling via npm.',

  buildOptions: function(options) {
    var superOptions = this._super.buildOptions.call(this, options);

    return _.extend(superOptions, {
      // by default, do install peoples optional deps
      'optional': 'optional' in options ? options.optional : true,
      'save-dev': !!options.packages && !!options['save-dev'],
      'save-exact': !!options.packages && !!options['save-exact']
    });
  },

  buildArgs: function(options) {
    var superArgs = this._super.buildArgs.call(this.options) || [];
    var packages = options.packages || [];

    return _.compact([].concat(superArgs, packages));
  }
});
