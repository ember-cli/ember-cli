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
    { name: 'embroider', type: Boolean, default: false, description: 'Enables the build system to use Embroider' },
    {
      name: 'ci-provider',
      type: ['travis', 'github', 'none'],
      default: 'github',
      description: 'Installs the optional default CI blueprint. Either Travis or Github Actions is supported.',
    },
    { name: 'typescript', type: Boolean, default: false, description: 'Set up the app to use TypeScript' },
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

    merge(blueprintOpts, {
      rawName: packageName,
      targetFiles: rawArgs || '',
      rawArgs: rawArgs.toString(),
      blueprint: normalizeBlueprint(blueprintOpts.blueprint || this._defaultBlueprint()),
      ciProvider,
    });

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
    const prependEmoji = require('../../lib/utilities/prepend-emoji');

    if (ciProvider === 'travis') {
      this.ui.writeLine('');

      deprecate(
        'Support for generating a Travis CI config file is deprecated.\nYou can keep using Travis CI, or you could also consider switching to GitHub Actions instead.',
        false,
        DEPRECATIONS.DEPRECATE_TRAVIS_CI_SUPPORT.options
      );
    }

    this.ui.writeLine('');
    this.ui.writeLine(prependEmoji('🎉', `Successfully created project ${chalk.yellow(projectName)}.`));
    this.ui.writeLine(prependEmoji('👉', 'Get started by typing:'));
    this.ui.writeLine('');
    const command = `cd ${projectName}`;
    this.ui.writeLine(`  ${chalk.gray('$')} ${chalk.cyan(command)}`);
    this.ui.writeLine(`  ${chalk.gray('$')} ${chalk.cyan(`${commandOptions.packageManager ?? 'npm'} start`)}`);
    this.ui.writeLine('');
    this.ui.writeLine('Happy coding!');
  },
});
