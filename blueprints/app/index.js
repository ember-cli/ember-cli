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
    }

    if (options.ciProvider !== 'github') {
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
