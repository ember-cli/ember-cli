'use strict';

const Command = require('../models/command');

module.exports = Command.extend({
  name: 'asset-sizes',
  description: 'Shows the sizes of your asset files.',
  skipHelp: true,

  availableOptions: [
    { name: 'output-path', type: 'Path', default: 'dist/', aliases: ['o'] },
    { name: 'json', type: Boolean, default: false },
  ],

  init() {
    this._super.apply(this, arguments);
    if (!this.isViteProject) {
      this.skipHelp = false;
    }
  },

  run(commandOptions) {
    return this.runTask('ShowAssetSizes', commandOptions);
  },
});
