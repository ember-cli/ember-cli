'use strict';

const NewCommand = require('./new');

module.exports = NewCommand.extend({
  name: 'addon',
  description: 'Generates a new folder structure for building an addon, complete with test harness.',

  availableOptions: [
    { name: 'dry-run', type: Boolean, default: false, aliases: ['d'] },
    { name: 'verbose', type: Boolean, default: false, aliases: ['v'] },
    { name: 'blueprint', type: String, default: 'addon', aliases: ['b'] },
    { name: 'skip-npm', type: Boolean, default: false, aliases: ['sn'] },
    { name: 'skip-bower', type: Boolean, default: false, aliases: ['sb'] },
    { name: 'skip-git', type: Boolean, default: false, aliases: ['sg'] },
    { name: 'yarn', type: Boolean }, // no default means use yarn if the blueprint has a yarn.lock
    { name: 'directory', type: String, aliases: ['dir'] },
    {
      name: 'lang',
      type: String,
      description: "Sets the base human language of the addon's own test application via index.html",
    },
  ],

  anonymousOptions: ['<addon-name>'],
});
