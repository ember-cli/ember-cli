'use strict';

const stringUtil = require('ember-cli-string-utils');
const chalk = require('chalk');
const { isExperimentEnabled } = require('@ember-tooling/blueprint-model/utilities/experiments');
const directoryForPackageName = require('@ember-tooling/blueprint-model/utilities/directory-for-package-name');
const blueprintVersion = require('./package.json').version;

module.exports = {
  name: '@ember-tooling/classic-build-app-blueprint',
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
          !options.emberData && `"--no-ember-data"`,
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
      blueprintVersion,
      yarn: options.packageManager === 'yarn',
      pnpm: options.packageManager === 'pnpm',
      npm: options.packageManager !== 'yarn' && options.packageManager !== 'pnpm',
      invokeScriptPrefix,
      execBinPrefix,
      welcome: options.welcome,
      blueprint: '@ember-tooling/classic-build-app-blueprint',
      blueprintOptions,
      embroider,
      lang: options.lang,
      emberData: options.emberData,
      ciProvider: options.ciProvider,
      typescript: options.typescript,
      strict: options.strict,
      packageManager: options.packageManager ?? 'npm',
    };
  },

  files(options) {
    if (this._files) {
      return this._files;
    }

    let files = this._super();

    if (options.ciProvider !== 'github') {
      files = files.filter((file) => file.indexOf('.github') < 0);
    }

    if (!options.typescript) {
      files = files.filter(
        (file) => !['tsconfig.json', 'app/config/', 'types/'].includes(file) && !file.endsWith('.d.ts')
      );
    }

    if (!options.emberData) {
      files = files.filter((file) => !file.includes('models/'));
      files = files.filter((file) => !file.includes('ember-data/'));
    }

    if (options.strict) {
      files = files.filter((file) => !file.endsWith('.hbs'));
    } else {
      files = files.filter((file) => !file.endsWith('.gjs') && !file.endsWith('.gts'));
    }

    this._files = files;

    return this._files;
  },

  beforeInstall() {
    const prependEmoji = require('@ember-tooling/blueprint-model/utilities/prepend-emoji');
    this.ui.writeLine(chalk.blue(`@ember-tooling/classic-build-app-blueprint v${blueprintVersion}`));
    this.ui.writeLine('');
    this.ui.writeLine(prependEmoji('✨', `Creating a new Ember app in ${chalk.yellow(process.cwd())}:`));
  },

  /**
   * @override
   *
   * This modification of buildFileInfo allows our differing
   * input files to output to a single file, depending on the options.
   * For example:
   *
   *   for javascript,
   *     _ts_eslint.config.mjs is deleted
   *     _js_eslint.config.mjs is renamed to eslint.config.mjs
   *
   *   for typescript,
   *     _js_eslint.config.mjs is deleted
   *     _ts_eslint.config.mjs is renamed to eslint.config.mjs
   */
  buildFileInfo(intoDir, templateVariables, file, options) {
    let fileInfo = this._super.buildFileInfo.apply(this, arguments);

    if (file.includes('_js_')) {
      if (options.typescript) {
        return null;
      }

      fileInfo.outputBasePath = fileInfo.outputPath.replace('_js_', '');
      fileInfo.outputPath = fileInfo.outputPath.replace('_js_', '');
      fileInfo.displayPath = fileInfo.outputPath.replace('_js_', '');
      return fileInfo;
    }

    if (file.includes('_ts_')) {
      if (!options.typescript) {
        return null;
      }

      fileInfo.outputBasePath = fileInfo.outputPath.replace('_ts_', '');
      fileInfo.outputPath = fileInfo.outputPath.replace('_ts_', '');
      fileInfo.displayPath = fileInfo.outputPath.replace('_ts_', '');
      return fileInfo;
    }

    return fileInfo;
  },
};
