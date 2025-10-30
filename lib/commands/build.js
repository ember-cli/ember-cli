'use strict';

const Command = require('../models/command');
const Win = require('../utilities/windows-admin');
const SilentError = require('silent-error');

const ClassicOptions = [
  { name: 'watch', type: Boolean, default: false, aliases: ['w'] },
  { name: 'watcher', type: String },
];

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
    { name: 'suppress-sizes', type: Boolean, default: false },
    { name: 'output-path', type: 'Path', default: 'dist/', aliases: ['o'] },
  ],

  init() {
    this._super.apply(this, arguments);
    if (!this.isViteProject) {
      this.description = 'Builds your app and places it into the output path (dist/ by default).';
      this.availableOptions = this.availableOptions.concat(ClassicOptions);
    } else if (process.env.EMBROIDER_PREBUILD) {
      // having the --watch option available surpresses a warning that you get in Vite prebuild
      this.availableOptions = this.availableOptions.concat(ClassicOptions[0]);
    }
  },

  async run(commandOptions) {
    if (this.isViteProject && !process.env.EMBROIDER_PREBUILD) {
      // --watch is used during Embroider prebuild but should never be used directly so we only throw in this case if
      // EMBROIDER_PREBUILD has been set
      if (commandOptions.watch) {
        return Promise.reject(
          new SilentError(
            'The `--watch` option to `ember build` is not supported in Vite-based projects. Please use `vite dev` instead.'
          )
        );
      }

      if (commandOptions.watcher) {
        return Promise.reject(
          new SilentError(
            'The `--watcher` option to `ember build` is not supported in Vite-based projects. Please use `vite dev` instead.'
          )
        );
      }
    }

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
