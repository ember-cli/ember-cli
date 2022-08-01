'use strict';

const stringUtil = require('ember-cli-string-utils');
const chalk = require('chalk');
const { isExperimentEnabled } = require('../../lib/experiments');
const directoryForPackageName = require('../../lib/utilities/directory-for-package-name');

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
    let embroider = isExperimentEnabled('EMBROIDER') || options.embroider;

    let hasOptions = !options.welcome || options.yarn || embroider || options.ciProvider || options.codeEditor;
    let blueprintOptions = '';
    if (hasOptions) {
      let indent = `\n            `;
      let outdent = `\n          `;

      blueprintOptions =
        indent +
        [
          !options.welcome && '"--no-welcome"',
          options.yarn && '"--yarn"',
          embroider && '"--embroider"',
          options.ciProvider && `"--ci-provider=${options.ciProvider}"`,
          options.codeEditor && `"--code-editor=${options.codeEditor}"`,
        ]
          .filter(Boolean)
          .join(',\n            ') +
        outdent;
    }

    return {
      appDirectory: directoryForPackageName(name),
      name,
      modulePrefix: name,
      namespace,
      emberCLIVersion: require('../../package').version,
      yarn: options.yarn,
      welcome: options.welcome,
      blueprint: 'app',
      blueprintOptions,
      embroider,
      lang: options.lang,
      ciProvider: options.ciProvider,
      codeEditor: options.codeEditor,
    };
  },

  files(options) {
    if (this._files) {
      return this._files;
    }

    let files = this._super();
    if (options.ciProvider !== 'travis') {
      this._files = files.filter((file) => file !== '.travis.yml');
    } else {
      this._files = files.filter((file) => file.indexOf('.github') < 0);
    }

    if (options.codeEditor !== 'vscode') {
      this._files = files.filter((file) => file.indexOf('.vscode') < 0);
    }

    return this._files;
  },

  beforeInstall() {
    const version = require('../../package.json').version;
    const prependEmoji = require('../../lib/utilities/prepend-emoji');

    this.ui.writeLine(chalk.blue(`Ember CLI v${version}`));
    this.ui.writeLine('');
    this.ui.writeLine(prependEmoji('✨', `Creating a new Ember app in ${chalk.yellow(process.cwd())}:`));
  },
};
