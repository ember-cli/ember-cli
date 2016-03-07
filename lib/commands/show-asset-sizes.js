'use strict';

var path    = require('path');
var Command = require('../models/command');

module.exports = Command.extend({
  name: 'show-asset-sizes',
  description: 'Show asset file sizes.',

  availableOptions: [
    { name: 'output-path', type: path, default: 'dist/', aliases: ['o'] }
  ],

  run: function(commandOptions) {
    var task = new this.tasks.ShowAssetSizes({
      ui: this.ui
    });
    return task.run(commandOptions);
  }
});
