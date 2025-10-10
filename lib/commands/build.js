'use strict';

const Command = require('../models/command');
const Win = require('../utilities/windows-admin');

module.exports = Command.extend({
  name: 'build',
  description: 'Vestigial command in Vite-based projects. Use the `build` script from package.json instead.',
  aliases: ['b'],

  availableOptions: [
    {
      name: 'environment',
      type: String,
      default: 'development',
      aliases: ['e', { dev: 'development' }, { prod: 'production' }],
      description: 'Possible values are "development", "production", and "test".',
    },
    { name: 'output-path', type: 'Path', default: 'dist/', aliases: ['o'] },
    { name: 'watch', type: Boolean, default: false, aliases: ['w'] },
    { name: 'watcher', type: String },
    { name: 'suppress-sizes', type: Boolean, default: false },
  ],

  init() {
    this._super.apply(this, arguments);
    if (!this.isViteProject) {
      this.description = 'Builds your app and places it into the output path (dist/ by default).';
    }
  },

  async run(commandOptions) {
    await Win.checkIfSymlinksNeedToBeEnabled(this.ui);

    let buildTaskName = commandOptions.watch ? 'BuildWatch' : 'Build';
    await this.runTask(buildTaskName, commandOptions);

    let isProduction = commandOptions.environment === 'production' || process.env.EMBER_ENV === 'production';
    if (!commandOptions.suppressSizes && isProduction) {
      return this.runTask('ShowAssetSizes', {
        outputPath: commandOptions.outputPath,
      });
    }
  },
});
