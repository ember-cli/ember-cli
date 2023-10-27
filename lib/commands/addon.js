'use strict';

const SilentError = require('silent-error');
const NewCommand = require('./new');

module.exports = NewCommand.extend({
  name: 'addon',
  description: 'Generates a new folder structure for building an addon, complete with test harness.',

  availableOptions: [
    { name: 'dry-run', type: Boolean, default: false, aliases: ['d'] },
    { name: 'verbose', type: Boolean, default: false, aliases: ['v'] },
    { name: 'blueprint', type: String, default: 'addon', aliases: ['b'] },
    { name: 'skip-npm', type: Boolean, default: false, aliases: ['sn', 'skip-install', 'si'] },
    { name: 'skip-git', type: Boolean, default: false, aliases: ['sg'] },
    {
      name: 'package-manager',
      type: ['npm', 'pnpm', 'yarn'],
      aliases: [{ npm: 'npm' }, { pnpm: 'pnpm' }, { yarn: 'yarn' }],
    },
    { name: 'directory', type: String, aliases: ['dir'] },
    {
      name: 'lang',
      type: String,
      description: "Sets the base human language of the addon's own test application via index.html",
    },
    {
      name: 'ci-provider',
      type: ['travis', 'github'],
      default: 'github',
      description: 'Installs the default CI blueprint. Either Travis or Github Actions is supported.',
    },
    { name: 'typescript', type: Boolean, default: false, description: 'Set up the addon to use TypeScript' },
  ],

  anonymousOptions: ['<addon-name>'],

  run(commandOptions, commandArguments) {
    let addonName = commandArguments[0];

    if (addonName) {
      return this._super(commandOptions, commandArguments);
    }

    return Promise.reject(
      new SilentError('The `ember addon` command requires a name to be specified. For more details, run `ember help`.')
    );
  },
});
