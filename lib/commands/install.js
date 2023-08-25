'use strict';

const Command = require('../models/command');
const SilentError = require('silent-error');
const { determineInstallCommand } = require('../utilities/package-managers');

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
      aliases: [{ npm: 'npm' }, { pnpm: 'pnpm' }, { yarn: 'yarn' }],
    },
  ],

  anonymousOptions: ['<addon-name>'],

  async run(commandOptions, addonNames) {
    if (!addonNames.length) {
      let installCommand = await determineInstallCommand(this.project.root);

      throw new SilentError(
        `An addon's name is required when running the \`install\` command. If you want to install all node modules, please run \`${installCommand}\` instead.`
      );
    }

    return this.runTask('AddonInstall', {
      packages: addonNames,
      blueprintOptions: commandOptions,
    });
  },

  _env() {
    return {
      ui: this.ui,
      project: this.project,
      NpmInstallTask: this.tasks.NpmInstall,
      BlueprintTask: this.tasks.GenerateFromBlueprint,
    };
  },
});
