'use strict';

const Command = require('../models/command');
const SilentError = require('silent-error');
const Promise = require('rsvp').Promise;

module.exports = Command.extend({
  name: 'install',
  description: 'Installs an ember-cli addon from npm.',
  aliases: ['i'],
  works: 'insideProject',

  availableOptions: [
    { name: 'save', type: Boolean, default: false, aliases: ['S'] },
    { name: 'save-dev', type: Boolean, default: true, aliases: ['D'] },
    { name: 'save-exact', type: Boolean, default: false, aliases: ['E', 'exact'] },
  ],

  anonymousOptions: [
    '<addon-name>',
  ],

  run(commandOptions, addonNames) {
    if (!addonNames.length) {
      let msg = 'The `install` command must take an argument with the name';
      msg += ' of an ember-cli addon. For installing all npm and bower ';
      msg += 'dependencies you can run `npm install && bower install`.';
      return Promise.reject(new SilentError(msg));
    }

    let AddonInstallTask = this.tasks.AddonInstall;
    let addonInstall = new AddonInstallTask({
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
      NpmInstallTask: this.tasks.NpmInstall,
      BlueprintTask: this.tasks.GenerateFromBlueprint,
    });

    return addonInstall.run({
      'packages': addonNames,
      blueprintOptions: commandOptions,
    });
  },
});
