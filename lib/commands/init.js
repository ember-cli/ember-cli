'use strict';

const clone = require('ember-cli-lodash-subset').clone;
const merge = require('ember-cli-lodash-subset').merge;
const Command = require('../models/command');
const Promise = require('rsvp').Promise;
const SilentError = require('silent-error');
const validProjectName = require('../utilities/valid-project-name');
const normalizeBlueprint = require('../utilities/normalize-blueprint-option');
const mergeBlueprintOptions = require('../utilities/merge-blueprint-options');
let logger = require('heimdalljs-logger')('ember-cli:command:init');

module.exports = Command.extend({
  name: 'init',
  description: 'Creates a new ember-cli project in the current folder.',
  works: 'everywhere',

  availableOptions: [
    { name: 'dry-run',    type: Boolean, default: false, aliases: ['d'] },
    { name: 'verbose',    type: Boolean, default: false, aliases: ['v'] },
    { name: 'blueprint',  type: String,                  aliases: ['b'] },
    { name: 'skip-npm',   type: Boolean, default: false, aliases: ['sn'] },
    { name: 'skip-bower', type: Boolean, default: false, aliases: ['sb'] },
    { name: 'name',       type: String,  default: '',    aliases: ['n'] },
  ],

  anonymousOptions: [
    '<glob-pattern>',
  ],

  _defaultBlueprint() {
    if (this.project.isEmberCLIAddon()) {
      return 'addon';
    } else {
      return 'app';
    }
  },

  beforeRun: mergeBlueprintOptions,

  run(commandOptions, rawArgs) {
    if (commandOptions.dryRun) {
      commandOptions.skipNpm = true;
      commandOptions.skipBower = true;
    }

    let installBlueprint = new this.tasks.InstallBlueprint({
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
    });

    let gitInit, npmInstall, generate, bowerInstall;

    // needs an explicit check in case it's just 'undefined'
    // due to passing of options from 'new' and 'addon'
    if (commandOptions.skipGit === false) {
      gitInit = new this.tasks.GitInit({
        ui: this.ui,
        project: this.project,
      });
    }

    if (!commandOptions.skipNpm) {
      npmInstall = new this.tasks.NpmInstall({
        ui: this.ui,
        analytics: this.analytics,
        project: this.project,
      });

      generate = new this.tasks.GenerateFromBlueprint({
        ui: this.ui,
        analytics: this.analytics,
        project: this.project,
        testing: this.testing,
      });
    }

    if (!commandOptions.skipBower) {
      bowerInstall = new this.tasks.BowerInstall({
        ui: this.ui,
        analytics: this.analytics,
        project: this.project,
      });
    }

    let project = this.project;
    let packageName = (commandOptions.name !== '.' && commandOptions.name) || project.name();

    if (!packageName) {
      let message = `The \`ember ${this.name}\` command requires a ` +
        `package.json in current folder with name attribute or a specified name via arguments. ` +
        `For more details, use \`ember help\`.`;

      return Promise.reject(new SilentError(message));
    }

    let blueprintOpts = clone(commandOptions);
    merge(blueprintOpts, {
      rawName: packageName,
      targetFiles: rawArgs || '',
      rawArgs: rawArgs.toString(),
      blueprint: normalizeBlueprint(blueprintOpts.blueprint || this._defaultBlueprint()),
    });

    if (!validProjectName(packageName)) {
      return Promise.reject(new SilentError(`We currently do not support a name of \`${packageName}\`.`));
    }

    logger.info('before:installblueprint');
    return installBlueprint.run(blueprintOpts)
      .then(() => {
        logger.info('after:installblueprint');
        if (!commandOptions.skipNpm) {
          return npmInstall.run({
            verbose: commandOptions.verbose,
            optional: false,
          }).then(() => {
            project.setupNodeModulesPath();
          });
        }
      })
      .then(() => {
        if (!commandOptions.skipBower) {
          return bowerInstall.run({
            verbose: commandOptions.verbose,
          });
        }
      })
      .then(() => {
        // skip `ember generate ember-cli-eslint` if the plugin hasn't been installed
        if (!commandOptions.skipNpm) {
          this.project.reloadAddons();

          return generate.run({
            verbose: commandOptions.verbose,
            args: ['ember-cli-eslint'],
            ignoreMissingMain: true,
          });
        }
      })
      .then(() => {
        if (commandOptions.skipGit === false) {
          return gitInit.run(commandOptions, rawArgs);
        }
      });
  },
});
