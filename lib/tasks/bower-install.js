'use strict';

// Runs `bower install` in cwd

var BowerTask   = require('./bower-task');
var _           = require('lodash');

module.exports = BowerTask.extend({
  command: 'install',
  startProgressMessage: 'Installing browser packages via Bower',
  completionMessage: 'Installed browser packages via Bower.',

  buildOptions: function(options) {
    var superOptions = this._super.buildOptions.call(this, options);

    var installOptions = options.installOptions || {};
    if (options.packages && typeof installOptions.save === 'undefined') {
      installOptions.save = true;
    }
    return _.extend(superOptions, installOptions);
  },

  buildArgs: function(options) {
    var superArgs = this._super.buildArgs.call(this.options) || [];
    var packages = options.packages || [];

    return _.compact([].concat(superArgs, packages));
  }
});
