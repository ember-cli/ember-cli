'use strict';

const Command = require('../models/command');
const { emberCLIVersion } = require('../utilities/version-utils');

module.exports = Command.extend({
  name: 'version',
  description: 'outputs ember-cli version',
  aliases: ['v', '--version', '-v'],
  works: 'everywhere',

  availableOptions: [
    { name: 'verbose', type: Boolean, default: false },
  ],

  run(options) {
    this.printVersion('ember-cli', emberCLIVersion());

    let {
      arch,
      versions,
      platform,
    } = process;
    versions['os'] = `${platform} ${arch}`;

    let alwaysPrint = ['node', 'os'];

    for (let module in versions) {
      if (options.verbose || alwaysPrint.indexOf(module) > -1) {
        this.printVersion(module, versions[module]);
      }
    }
  },

  printVersion(module, version) {
    this.ui.writeLine(`${module}: ${version}`);
  },
});
