'use strict';

const clone = require('ember-cli-lodash-subset').clone;
const merge = require('ember-cli-lodash-subset').merge;
const Command = require('../models/command');
const SilentError = require('silent-error');
const chalk = require('chalk');
const isValidProjectName = require('../utilities/valid-project-name');
const normalizeBlueprint = require('../utilities/normalize-blueprint-option');
const mergeBlueprintOptions = require('../utilities/merge-blueprint-options');
const isYarnProject = require('../utilities/is-yarn-project');
const getLangArg = require('../../lib/utilities/get-lang-arg');

module.exports = Command.extend({
  name: 'init',
  description: 'Reinitializes a new ember-cli project in the current folder.',
  works: 'everywhere',

  availableOptions: [
    { name: 'dry-run', type: Boolean, default: false, aliases: ['d'] },
    { name: 'verbose', type: Boolean, default: false, aliases: ['v'] },
    { name: 'blueprint', type: String, aliases: ['b'] },
    { name: 'skip-npm', type: Boolean, default: false, aliases: ['sn'] },
    { name: 'skip-bower', type: Boolean, default: false, aliases: ['sb'] },
    { name: 'lint-fix', type: Boolean, default: true },
    {
      name: 'welcome',
      type: Boolean,
      default: true,
      description: 'Installs and uses {{ember-welcome-page}}. Use --no-welcome to skip it.',
    },
    { name: 'yarn', type: Boolean }, // no default means use yarn if the blueprint has a yarn.lock
    { name: 'name', type: String, default: '', aliases: ['n'] },
    {
      name: 'lang',
      type: String,
      description: 'Sets the base human language of the application via index.html',
    },
    { name: 'embroider', type: Boolean, default: false, description: 'Enables the build system to use Embroider' },
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
      commandOptions.skipBower = true;
    }

    let project = this.project;
    let packageName = (commandOptions.name !== '.' && commandOptions.name) || project.name();

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

    let blueprintOpts = clone(commandOptions);

    if (blueprintOpts.yarn === undefined) {
      blueprintOpts.yarn = isYarnProject(project.root);
    }

    merge(blueprintOpts, {
      rawName: packageName,
      targetFiles: rawArgs || '',
      rawArgs: rawArgs.toString(),
      blueprint: normalizeBlueprint(blueprintOpts.blueprint || this._defaultBlueprint()),
    });

    if (!isValidProjectName(packageName)) {
      return Promise.reject(new SilentError(`We currently do not support a name of \`${packageName}\`.`));
    }

    await this.runTask('InstallBlueprint', blueprintOpts);

    if (!commandOptions.skipNpm) {
      await this.runTask('NpmInstall', {
        verbose: commandOptions.verbose,
        useYarn: commandOptions.yarn,
      });
    }

    if (!commandOptions.skipBower) {
      await this.runTask('BowerInstall', {
        verbose: commandOptions.verbose,
      });
    }

    if (commandOptions.skipGit === false) {
      await this.runTask('GitInit', commandOptions, rawArgs);
    }
    const projectName = this.project.name();
    const prependEmoji = require('../../lib/utilities/prepend-emoji');

    this.ui.writeLine('');
    this.ui.writeLine(prependEmoji('🎉', `Successfully created project ${chalk.yellow(projectName)}.`));
    this.ui.writeLine(prependEmoji('👉 ', 'Get started by typing:'));
    this.ui.writeLine('');
    const command = `cd ${projectName}`;
    this.ui.writeLine(`  ${chalk.gray('$')} ${chalk.cyan(command)}`);
    const packageManager = commandOptions.yarn ? 'yarn' : 'npm';
    this.ui.writeLine(`  ${chalk.gray('$')} ${chalk.cyan(`${packageManager} start`)}`);
    this.ui.writeLine('');
    this.ui.writeLine('Happy coding!');
  },
});
