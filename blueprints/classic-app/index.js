'use strict';

const stringUtil = require('ember-cli-string-utils');
const chalk = require('chalk');

module.exports = {
  description: 'The default blueprint for ember-cli projects.',

  filesToRemove: [
    'app/styles/.gitkeep',
    'app/templates/.gitkeep',
    'app/views/.gitkeep',
    'public/.gitkeep',
    'Brocfile.js',
    'testem.json',
  ],

  locals(options) {
    let entity = options.entity;
    let rawName = entity.name;
    let name = stringUtil.dasherize(rawName);
    let namespace = stringUtil.classify(rawName);

    return {
      name,
      modulePrefix: name,
      namespace,
      emberCLIVersion: require('../../package').version,
      yarn: options.yarn,
      welcome: options.welcome,
      blueprint: 'app',
    };
  },

  beforeInstall() {
    const version = require('../../package.json').version;
    const prependEmoji = require('../../lib/utilities/prepend-emoji');

    this.ui.writeLine(chalk.blue(`Ember CLI v${version}`));
    this.ui.writeLine('');
    this.ui.writeLine(prependEmoji('✨', `Creating a new Ember app in ${chalk.yellow(process.cwd())}:`));
  },
};
