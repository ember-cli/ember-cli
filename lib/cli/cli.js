'use strict';

const lookupCommand = require('./lookup-command');
const getOptionArgs = require('../utilities/get-option-args');
const hash = require('promise.hash.helper');
const logger = require('heimdalljs-logger')('ember-cli:cli');
const loggerTesting = require('heimdalljs-logger')('ember-cli:testing');
const Instrumentation = require('../models/instrumentation');
const PackageInfoCache = require('../models/package-info-cache');
const heimdall = require('heimdalljs');

const onProcessInterrupt = require('../utilities/will-interrupt-process');

class CLI {
  /**
   * @private
   * @class CLI
   * @constructor
   * @param options
   */
  constructor(options) {
    /**
     * @private
     * @property name
     */
    this.name = options.name;

    /**
     * @private
     * @property ui
     * @type UI
     */
    this.ui = options.ui;

    /**
     * @private
     * @property analytics
     */
    this.analytics = options.analytics;

    /**
     * @private
     * @property testing
     * @type Boolean
     */
    this.testing = options.testing;

    /**
     * @private
     * @property disableDependencyChecker
     * @type Boolean
     */
    this.disableDependencyChecker = options.disableDependencyChecker;

    /**
     * @private
     * @property root
     */
    this.root = options.root;

    /**
     * @private
     * @property npmPackage
     */
    this.npmPackage = options.npmPackage;

    /**
     * @private
     * @property instrumentation
     */
    this.instrumentation =
      options.instrumentation ||
      new Instrumentation({
        ui: options.ui,
        initInstrumentation: options.initInstrumentation,
      });

    this.packageInfoCache = new PackageInfoCache(this.ui);

    logger.info('testing %o', !!this.testing);
  }

  /**
   * @private
   * @method maybeMakeCommand
   * @param commandName
   * @param commandArgs
   * @return {null|CurrentCommand}
   */
  maybeMakeCommand(commandName, commandArgs) {
    if (this._environment === undefined) {
      throw new Error('Unable to make command without environment, you have to execute "run" method first.');
    }
    let CurrentCommand = lookupCommand(this._environment.commands, commandName, commandArgs, {
      project: this._environment.project,
      ui: this.ui,
    });

    /*
     * XXX Need to decide what to do here about showing errors. For
     * a non-CLI project the cache is local and probably should. For
     * a CLI project the cache is there, but not sure when we'll know
     * about all the errors, because there may be multiple projects.
     *   if (this.packageInfoCache.hasErrors()) {
     *     this.packageInfoCache.showErrors();
     *   }
     */
    let command = new CurrentCommand({
      ui: this.ui,
      analytics: this.analytics,
      commands: this._environment.commands,
      tasks: this._environment.tasks,
      project: this._environment.project,
      settings: this._environment.settings,
      testing: this.testing,
      cli: this,
    });

    return command;
  }

  /**
   * @private
   * @method run
   * @param {Promise<object>} environmentPromiseHash
   * @return {Promise}
   */
  async run(environmentPromiseHash) {
    if (environmentPromiseHash === undefined) {
      return Promise.reject(new Error('Unable to execute "run" command without environment argument'));
    }
    let shutdownOnExit = null;

    let environment = (this._environment = await hash(environmentPromiseHash));

    try {
      let args = environment.cliArgs.slice();
      let commandName = args.shift();
      let commandArgs = args;
      let helpOptions;

      let commandLookupCreationToken = heimdall.start('lookup-command');

      let command = this.maybeMakeCommand(commandName, commandArgs);

      commandLookupCreationToken.stop();

      getOptionArgs('--verbose', commandArgs).forEach((arg) => {
        process.env[`EMBER_VERBOSE_${arg.toUpperCase()}`] = 'true';
      });

      let platformCheckerToken = heimdall.start('platform-checker');

      const emberCLIVersion = require('../../package.json').version;
      const PlatformChecker = require('../utilities/platform-checker');
      let platform = new PlatformChecker(process.version);
      let recommendation =
        ' See "https://github.com/ember-cli/ember-cli/blob/master/docs/node-support.md" to find out which version of Node is best to use.';

      if (!this.testing) {
        if (platform.isDeprecated) {
          this.ui.writeDeprecateLine(
            `Node ${process.version} is no longer supported by Ember CLI v${emberCLIVersion}.${recommendation}`
          );
        }

        if (!platform.isTested) {
          this.ui.writeWarnLine(
            `Ember CLI v${emberCLIVersion} is not tested against Node ${process.version}.${recommendation}`
          );
        }
      }

      platformCheckerToken.stop();

      logger.info('command: %s', commandName);

      if (!this.testing) {
        process.chdir(environment.project.root);
        let skipInstallationCheck = commandArgs.indexOf('--skip-installation-check') !== -1;
        if (environment.project.isEmberCLIProject() && !skipInstallationCheck) {
          const InstallationChecker = require('../models/installation-checker');
          new InstallationChecker({ project: environment.project }).checkInstallations();
        }
      }

      let instrumentation = this.instrumentation;
      let onCommandInterrupt;

      let runPromise = Promise.resolve().then(async () => {
        let resultOrExitCode;

        try {
          instrumentation.stopAndReport('init');

          try {
            instrumentation.start('command');

            loggerTesting.info('cli: command.beforeRun');
            onProcessInterrupt.addHandler(onCommandInterrupt);

            await command.beforeRun(commandArgs);

            loggerTesting.info('cli: command.validateAndRun');

            resultOrExitCode = await command.validateAndRun(commandArgs);
          } finally {
            instrumentation.stopAndReport('command', commandName, commandArgs);

            onProcessInterrupt.removeHandler(onCommandInterrupt);
          }
        } finally {
          instrumentation.start('shutdown');
          shutdownOnExit = function () {
            instrumentation.stopAndReport('shutdown');
          };
        }

        // if the help option was passed, call the help command
        if (resultOrExitCode === 'callHelp') {
          helpOptions = {
            environment,
            commandName,
            commandArgs,
          };

          resultOrExitCode = await this.callHelp(helpOptions);
        }

        let exitCode = resultOrExitCode;

        loggerTesting.info(`cli: command run complete. exitCode: ${exitCode}`);
        // TODO: fix this
        // Possibly this issue: https://github.com/joyent/node/issues/8329
        // Wait to resolve promise when running on windows.
        // This ensures that stdout is flushed so acceptance tests get full output

        if (process.platform === 'win32') {
          return new Promise((resolve) => {
            setTimeout(resolve, 250, exitCode);
          });
        } else {
          return exitCode;
        }
      });

      onCommandInterrupt = async () => {
        await command.onInterrupt();

        return await runPromise;
      };

      return await runPromise;
    } catch (error) {
      this.logError(error);
      return 1;
    } finally {
      if (shutdownOnExit) {
        shutdownOnExit();
      }
    }
  }

  /**
   * @private
   * @method callHelp
   * @param options
   * @return {Promise}
   */
  callHelp(options) {
    let environment = options.environment;
    let commandName = options.commandName;
    let commandArgs = options.commandArgs;
    let helpIndex = commandArgs.indexOf('--help');
    let hIndex = commandArgs.indexOf('-h');

    let HelpCommand = lookupCommand(environment.commands, 'help', commandArgs, {
      project: environment.project,
      ui: this.ui,
    });

    let help = new HelpCommand({
      ui: this.ui,
      analytics: this.analytics,
      commands: environment.commands,
      tasks: environment.tasks,
      project: environment.project,
      settings: environment.settings,
      testing: this.testing,
    });

    if (helpIndex > -1) {
      commandArgs.splice(helpIndex, 1);
    }

    if (hIndex > -1) {
      commandArgs.splice(hIndex, 1);
    }

    commandArgs.unshift(commandName);

    return help.validateAndRun(commandArgs);
  }

  /**
   * @private
   * @method logError
   * @param error
   * @return {number}
   */
  logError(error) {
    if (this.testing && error) {
      console.error(error.message);
      if (error.stack) {
        console.error(error.stack);
      }
      throw error;
    }
    this.ui.errorLog.push(error);
    this.ui.writeError(error);
    return 1;
  }
}

module.exports = CLI;
