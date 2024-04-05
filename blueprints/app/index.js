'use strict';

const stringUtil = require('ember-cli-string-utils');
const chalk = require('chalk');
const { isExperimentEnabled } = require('../../lib/experiments');
const directoryForPackageName = require('../../lib/utilities/directory-for-package-name');

module.exports = {
  description: 'The default blueprint for ember-cli projects.',

  shouldTransformTypeScript: true,

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

    let hasOptions = !options.welcome || options.packageManager || embroider || options.ciProvider;
    let blueprintOptions = '';
    if (hasOptions) {
      let indent = `\n            `;
      let outdent = `\n          `;

      blueprintOptions =
        indent +
        [
          !options.welcome && '"--no-welcome"',
          options.packageManager === 'yarn' && '"--yarn"',
          options.packageManager === 'pnpm' && '"--pnpm"',
          embroider && '"--embroider"',
          options.ciProvider && `"--ci-provider=${options.ciProvider}"`,
          options.typescript && `"--typescript"`,
        ]
          .filter(Boolean)
          .join(',\n            ') +
        outdent;
    }

    let invokeScriptPrefix = 'npm run';
    let execBinPrefix = 'npm exec';

    if (options.packageManager === 'yarn') {
      invokeScriptPrefix = 'yarn';
      execBinPrefix = 'yarn';
    }

    if (options.packageManager === 'pnpm') {
      invokeScriptPrefix = 'pnpm';
      execBinPrefix = 'pnpm';
    }

    return {
      appDirectory: directoryForPackageName(name),
      name,
      modulePrefix: name,
      namespace,
      emberCLIVersion: require('../../package').version,
      yarn: options.packageManager === 'yarn',
      pnpm: options.packageManager === 'pnpm',
      npm: options.packageManager !== 'yarn' && options.packageManager !== 'pnpm',
      invokeScriptPrefix,
      execBinPrefix,
      welcome: options.welcome,
      blueprint: 'app',
      blueprintOptions,
      embroider,
      lang: options.lang,
      ciProvider: options.ciProvider,
      typescript: options.typescript,
      packageManager: options.packageManager ?? 'npm',
    };
  },

  files(options) {
    if (this._files) {
      return this._files;
    }

    let files = this._super();
    if (options.ciProvider !== 'travis') {
      files = files.filter((file) => file !== '.travis.yml');
    } else {
      files = files.filter((file) => file.indexOf('.github') < 0);
    }

    if (!options.typescript) {
      files = files.filter(
        (file) => !['tsconfig.json', 'app/config/', 'types/'].includes(file) && !file.endsWith('.d.ts')
      );
    }

    this._files = files;

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
