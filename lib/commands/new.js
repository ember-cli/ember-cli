'use strict';

const { default: chalk } = require('chalk');
const Command = require('../models/command');
const Project = require('../models/project');
const SilentError = require('silent-error');
const isValidProjectName = require('../utilities/valid-project-name');
const normalizeBlueprint = require('../utilities/normalize-blueprint-option');
const mergeBlueprintOptions = require('../utilities/merge-blueprint-options');
const { deprecate, DEPRECATIONS } = require('../debug');

const LANG_OPTION_ERROR_MESSAGE = [
  'The "--lang" option requires a value.',
  '',
  'Information about using the `--lang` flag:',
  '  The `--lang` flag sets the base human language of an app or test app:',
  '    - `app/index.html` (app)',
  '    - `tests/dummy/app/index.html` (addon test app)',
  '  If used, the lang option must specify a valid language code.',
  '  For default behavior, remove the flag.',
  '  See `ember <command> help` for more information.',
].join('\n');

module.exports = Command.extend({
  name: 'new',
  description: `Creates a new directory and runs ${chalk.green('ember init')} in it.`,
  works: 'everywhere',

  availableOptions: [
    { name: 'dry-run', type: Boolean, default: false, aliases: ['d'] },
    { name: 'verbose', type: Boolean, default: false, aliases: ['v'] },
    { name: 'blueprint', type: String, default: 'app', aliases: ['b'] },
    { name: 'skip-npm', type: Boolean, default: false, aliases: ['sn', 'skip-install', 'si'] },
    { name: 'skip-git', type: Boolean, default: false, aliases: ['sg'] },
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
    { name: 'directory', type: String, aliases: ['dir'] },
    {
      name: 'lang',
      type: String,
      description: 'Sets the base human language of the application via index.html',
    },
    { name: 'lint-fix', type: Boolean, default: true },
    {
      name: 'embroider',
      type: Boolean,
      default: false,
      description: 'Deprecated: Enables the build system to use Embroider',
    },
    {
      name: 'ci-provider',
      type: ['github', 'none'],
      description: 'Installs the optional default CI blueprint. Only Github Actions is supported at the moment.',
    },
    {
      name: 'ember-data',
      type: Boolean,
      default: true,
      description: 'Include ember-data dependencies and configuration',
    },
    {
      name: 'interactive',
      type: Boolean,
      default: false,
      aliases: ['i'],
      description: 'Create a new Ember app/addon in an interactive way.',
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
      default: true,
      description: 'Use GJS/GTS templates by default for generated components, tests, and route templates',
    },
  ],

  anonymousOptions: ['<app-name>'],

  beforeRun: mergeBlueprintOptions,

  async run(commandOptions, rawArgs) {
    if (commandOptions.lang === '' || commandOptions.lang === true) {
      return Promise.reject(new SilentError(LANG_OPTION_ERROR_MESSAGE));
    }
    deprecate(
      "Don't use `--embroider` option. Generating a new project will use the latest Vite-based embroider by default.",
      !commandOptions.embroider,
      DEPRECATIONS.EMBROIDER.options
    );

    let projectName = rawArgs[0],
      message;

    commandOptions.name = rawArgs.shift();

    if (!projectName || commandOptions.interactive) {
      let answers = await this.runTask('InteractiveNew', commandOptions);

      commandOptions.blueprint = answers.blueprint;

      if (answers.name) {
        projectName = answers.name;
        commandOptions.name = answers.name;
      }

      if (answers.emberData) {
        commandOptions.emberData = answers.emberData;
      }

      if (answers.lang) {
        commandOptions.lang = answers.lang;
      }

      if (answers.packageManager) {
        commandOptions.packageManager = answers.packageManager;
      }

      if (answers.ciProvider) {
        commandOptions.ciProvider = answers.ciProvider;
      }
    }

    if (!commandOptions.ciProvider) {
      commandOptions.ciProvider = 'github';
    }

    if (commandOptions.dryRun) {
      commandOptions.skipGit = true;
    }

    if (projectName === '.') {
      let blueprintName = commandOptions.blueprint === 'app' ? 'application' : commandOptions.blueprint;
      message = `Trying to generate an ${blueprintName} structure in this directory? Use \`ember init\` instead.`;

      return Promise.reject(new SilentError(message));
    }

    if (!isValidProjectName(projectName)) {
      message = `We currently do not support a name of \`${projectName}\`.`;

      return Promise.reject(new SilentError(message));
    }

    commandOptions.blueprint = normalizeBlueprint(commandOptions.blueprint);

    let InitCommand = this.commands.Init;

    let initCommand = new InitCommand({
      ui: this.ui,
      tasks: this.tasks,
      project: Project.nullProject(this.ui, this.cli),
    });

    await this.runTask('CreateAndStepIntoDirectory', {
      projectName,
      directoryName: commandOptions.directory,
      dryRun: commandOptions.dryRun,
    });

    initCommand.project.root = process.cwd();

    deprecate(
      "Don't use `--embroider` option. Generating a new project will use the latest Vite-based embroider by default.",
      !commandOptions.embroider,
      DEPRECATIONS.EMBROIDER.options
    );

    return await initCommand.run(commandOptions, rawArgs);
  },
});
