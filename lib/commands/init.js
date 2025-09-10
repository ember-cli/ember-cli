'use strict';

const clone = require('lodash/clone');
const merge = require('lodash/merge');
const Command = require('../models/command');
const SilentError = require('silent-error');
const chalk = require('chalk');
const isValidProjectName = require('../utilities/valid-project-name');
const normalizeBlueprint = require('../utilities/normalize-blueprint-option');
const mergeBlueprintOptions = require('../utilities/merge-blueprint-options');
const { isPnpmProject, isYarnProject } = require('../utilities/package-managers');
const getLangArg = require('../../lib/utilities/get-lang-arg');
const { deprecate, DEPRECATIONS } = require('../debug');

const { isExperimentEnabled } = require('@ember-tooling/blueprint-model/utilities/experiments');

module.exports = Command.extend({
  name: 'init',
  description: 'Reinitializes a new ember-cli project in the current folder.',
  works: 'everywhere',

  availableOptions: [
    { name: 'dry-run', type: Boolean, default: false, aliases: ['d'] },
    { name: 'verbose', type: Boolean, default: false, aliases: ['v'] },
    { name: 'blueprint', type: String, aliases: ['b'] },
    { name: 'skip-npm', type: Boolean, default: false, aliases: ['sn', 'skip-install', 'si'] },
    { name: 'lint-fix', type: Boolean, default: true },
    {
      name: 'welcome',
      type: Boolean,
      default: true,
      description: 'Installs and uses {{ember-welcome-page}}. Use --no-welcome to skip it.',
    },
    {
      name: 'package-manager',
      type: ['npm', 'pnpm', 'yarn'],
      aliases: [{ npm: 'npm' }, { pnpm: 'pnpm' }, { yarn: 'yarn' }],
    },
    { name: 'name', type: String, default: '', aliases: ['n'] },
    {
      name: 'lang',
      type: String,
      description: 'Sets the base human language of the application via index.html',
    },
    {
      name: 'embroider',
      type: Boolean,
      default: false,
      description: 'Deprecated: Enables the build system to use Embroider',
    },
    {
      name: 'ci-provider',
      type: ['github', 'none'],
      default: 'github',
      description: 'Installs the optional default CI blueprint. Only Github Actions is supported at the moment.',
    },
    {
      name: 'ember-data',
      type: Boolean,
      default: true,
      description: 'Include ember-data dependencies and configuration',
    },
    {
      name: 'typescript',
      type: Boolean,
      default: false,
      description: 'Set up the app to use TypeScript',
      aliases: ['ts'],
    },
    {
      name: 'strict',
      type: Boolean,
      default: false,
      description: 'Use GJS/GTS templates by default for generated components, tests, and route templates',
    },
  ],

  anonymousOptions: ['<glob-pattern>'],

  _defaultBlueprint() {
    if (this.project.isEmberCLIAddon()) {
      return 'addon';
    } else {
      return 'app';
    }
  },

  beforeRun: mergeBlueprintOptions,

  async run(commandOptions, rawArgs) {
    deprecate(
      "Don't use `--embroider` option. Use `-b @ember/app-blueprint` instead.",
      !commandOptions.embroider,
      DEPRECATIONS.EMBROIDER.options
    );

    if (commandOptions.dryRun) {
      commandOptions.skipNpm = true;
    }

    let project = this.project;
    let packageName = (commandOptions.name !== '.' && commandOptions.name) || project.name();
    let ciProvider = commandOptions.ciProvider;

    if (!packageName) {
      let message =
        `The \`ember ${this.name}\` command requires a ` +
        `package.json in current folder with name attribute or a specified name via arguments. ` +
        `For more details, use \`ember help\`.`;

      return Promise.reject(new SilentError(message));
    }

    if (commandOptions.lang) {
      commandOptions.lang = getLangArg(commandOptions.lang, this.ui);
    }

    if (commandOptions.packageManager === undefined && project.isEmberCLIProject()) {
      if (await isPnpmProject(project.root)) {
        commandOptions.packageManager = 'pnpm';
      } else if (isYarnProject(project.root)) {
        commandOptions.packageManager = 'yarn';
      }
    }

    let blueprintOpts = clone(commandOptions);
    let blueprint = normalizeBlueprint(blueprintOpts.blueprint || this._defaultBlueprint());

    if (isExperimentEnabled('VITE') && blueprint === 'app') {
      blueprint = '@ember/app-blueprint';
    }

    merge(blueprintOpts, {
      rawName: packageName,
      targetFiles: rawArgs || [],
      rawArgs: rawArgs.toString(),
      blueprint,
      ciProvider,
    });

    let { targetFiles } = blueprintOpts;

    deprecate(
      `Do not pass file names or globs to \`init\`. Passed: "${targetFiles.join(' ')}"`,
      targetFiles.length === 0,
      DEPRECATIONS.INIT_TARGET_FILES.options
    );

    if (!isValidProjectName(packageName)) {
      return Promise.reject(new SilentError(`We currently do not support a name of \`${packageName}\`.`));
    }

    await this.runTask('InstallBlueprint', blueprintOpts);

    if (!commandOptions.skipNpm) {
      await this.runTask('NpmInstall', {
        verbose: commandOptions.verbose,
        packageManager: commandOptions.packageManager,
      });
    }

    if (commandOptions.skipGit === false) {
      await this.runTask('GitInit', commandOptions, rawArgs);
    }

    const projectName = this.project.name();
    const prependEmoji = require('@ember-tooling/blueprint-model/utilities/prepend-emoji');

    this.ui.writeLine('');
    this.ui.writeLine(prependEmoji('🎉', `Successfully created project ${chalk.yellow(projectName)}.`));
    this.ui.writeLine(prependEmoji('👉', 'Get started by typing:'));
    this.ui.writeLine('');
    const command = `cd ${projectName}`;
    this.ui.writeLine(`  ${chalk.gray('$')} ${chalk.cyan(command)}`);
    this.ui.writeLine(`  ${chalk.gray('$')} ${chalk.cyan(`${commandOptions.packageManager ?? 'npm'} start`)}`);
    this.ui.writeLine('');
    this.ui.writeLine('Happy coding!');

    deprecate(
      "Don't use `--embroider` option. Use `-b @ember/app-blueprint` instead.",
      !commandOptions.embroider,
      DEPRECATIONS.EMBROIDER.options
    );
  },
});
