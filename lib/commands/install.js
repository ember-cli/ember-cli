'use strict';

const Command = require('../models/command');
const SilentError = require('silent-error');

module.exports = Command.extend({
  name: 'install',
  description: 'Installs an ember-cli addon from npm.',
  aliases: ['i'],
  works: 'insideProject',

  availableOptions: [
    { name: 'save', type: Boolean, default: false, aliases: ['S'] },
    { name: 'save-dev', type: Boolean, default: true, aliases: ['D'] },
    { name: 'save-exact', type: Boolean, default: false, aliases: ['E', 'exact'] },
    {
      name: 'package-manager',
      type: ['npm', 'pnpm', 'yarn'],
      description:
        'Use this option to force the usage of a specific package manager. ' +
        'By default, ember-cli will try to detect the right package manager ' +
        'from any lockfiles that exist in your project.',
      aliases: [{ yarn: 'yarn' }, { pnpm: 'pnpm' }],
    },
  ],

  anonymousOptions: ['<addon-name>'],

  run(commandOptions, addonNames) {
    if (!addonNames.length) {
      let msg = 'The `install` command must take an argument with the name';
      msg += ' of an ember-cli addon. For installing all npm and bower ';
      msg += 'dependencies you can run `npm install && bower install`.';
      return Promise.reject(new SilentError(msg));
    }

    return this.runTask('AddonInstall', {
      packages: addonNames,
      blueprintOptions: commandOptions,
    });
  },

  _env() {
    return {
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
      NpmInstallTask: this.tasks.NpmInstall,
      BlueprintTask: this.tasks.GenerateFromBlueprint,
    };
  },
});
