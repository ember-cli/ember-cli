'use strict';

const Command = require('../models/command');
const Win = require('../utilities/windows-admin');

module.exports = Command.extend({
  name: 'build',
  description: 'Builds your app and places it into the output path (dist/ by default).',
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

  async run(commandOptions) {
    await Win.checkIfSymlinksNeedToBeEnabled(this.ui);

    let BuildTask = commandOptions.watch ? require('../tasks/build-watch') : require('../tasks/build');
    await this.runTask(BuildTask, commandOptions);

    let isProduction = commandOptions.environment === 'production' || process.env.EMBER_ENV === 'production';
    if (!commandOptions.suppressSizes && isProduction) {
      const ShowAssetSizes = require('../tasks/show-asset-sizes');
      return this.runTask(ShowAssetSizes, {
        outputPath: commandOptions.outputPath,
      });
    }
  },
});
