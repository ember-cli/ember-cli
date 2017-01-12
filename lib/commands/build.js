'use strict';

const Command = require('../models/command');
const Win = require('../utilities/windows-admin');

module.exports = Command.extend({
  name: 'build',
  description: 'Builds your app and places it into the output path (dist/ by default).',
  aliases: ['b'],

  availableOptions: [
    { name: 'environment',    type: String,  default: 'development', aliases: ['e', { 'dev': 'development' }, { 'prod': 'production' }], description: 'Possible values are "development", "production", and "test".' },
    { name: 'output-path',    type: 'Path',  default: 'dist/',       aliases: ['o'] },
    { name: 'watch',          type: Boolean, default: false,         aliases: ['w'] },
    { name: 'watcher',        type: String },
    { name: 'suppress-sizes', type: Boolean, default: false },
  ],

  run(commandOptions) {
    let BuildTask = this.taskFor(commandOptions);
    let buildTask = new BuildTask({
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
    });
    let ShowAssetSizesTask = this.tasks.ShowAssetSizes;
    let showTask = new ShowAssetSizesTask({
      ui: this.ui,
    });

    return Win.checkIfSymlinksNeedToBeEnabled(this.ui)
      .then(() => buildTask.run(commandOptions))
      .then(() => {
        if (!commandOptions.suppressSizes && commandOptions.environment === 'production') {
          return showTask.run({
            outputPath: commandOptions.outputPath,
          });
        }
      });
  },

  taskFor(options) {
    if (options.watch) {
      return this.tasks.BuildWatch;
    } else {
      return this.tasks.Build;
    }
  },
});
