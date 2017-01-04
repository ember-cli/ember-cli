'use strict';

let lookupCommand = require('./lookup-command');
let Promise = require('../ext/promise');
let getOptionArgs = require('../utilities/get-option-args');
let logger = require('heimdalljs-logger')('ember-cli:cli');
let loggerTesting = require('heimdalljs-logger')('ember-cli:testing');
let Instrumentation = require('../models/instrumentation');
let exit = require('capture-exit');
let heimdall = require('heimdalljs');

/**
 * @private
 * @class CLI
 * @constructor
 * @param options
 */
function CLI(options) {
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
  this.instrumentation = options.instrumentation || new Instrumentation({
    ui: options.ui,
    initInstrumentation: options.initInstrumentation,
  });

  logger.info('testing %o', !!this.testing);
}

module.exports = CLI;

/**
 * @private
 * @method run
 * @param environment
 * @return {Promise}
 */
CLI.prototype.run = function(environment) {
  let shutdownOnExit = null;

  return Promise.hash(environment).then(environment => {
    let args = environment.cliArgs.slice();
    let commandName = args.shift();
    let commandArgs = args;
    let helpOptions;

    let commandLookupCreationtoken = heimdall.start('lookup-command');

    let CurrentCommand = lookupCommand(environment.commands, commandName, commandArgs, {
      project: environment.project,
      ui: this.ui,
    });

    let command = new CurrentCommand({
      ui: this.ui,
      analytics: this.analytics,
      commands: environment.commands,
      tasks: environment.tasks,
      project: environment.project,
      settings: environment.settings,
      testing: this.testing,
      cli: this,
    });

    commandLookupCreationtoken.stop();

    getOptionArgs('--verbose', commandArgs).forEach(arg => {
      process.env[`EMBER_VERBOSE_${arg.toUpperCase()}`] = 'true';
    });

    let platformCheckerToken = heimdall.start('platform-checker');

    let PlatformChecker = require('../utilities/platform-checker');
    let platform = new PlatformChecker(process.version);
    let recommendation = ' We recommend that you use the most-recent "Active LTS" version of Node.js.';

    if (!this.testing) {
      if (platform.isDeprecated) {
        this.ui.writeDeprecateLine(`Node ${process.version} is no longer supported by Ember CLI.${recommendation}`);
      }

      if (!platform.isTested) {
        this.ui.writeWarnLine(`Node ${process.version} is not tested against Ember CLI on your platform.${recommendation}`);
      }
    }

    platformCheckerToken.stop();

    logger.info('command: %s', commandName);

    if (!this.testing) {
      process.chdir(environment.project.root);
      let skipInstallationCheck = commandArgs.indexOf('--skip-installation-check') !== -1;
      if (environment.project.isEmberCLIProject() && !skipInstallationCheck) {
        let InstallationChecker = require('../models/installation-checker');
        new InstallationChecker({ project: environment.project }).checkInstallations();
      }
    }

    let instrumentation = this.instrumentation;
    shutdownOnExit = function() {
      instrumentation.stopAndReport('shutdown');
    };

    return Promise.resolve().then(() => {
      instrumentation.stopAndReport('init');
      instrumentation.start('command');

      loggerTesting.info('cli: command.beforeRun');

      return command.beforeRun(commandArgs);

    }).then(() => {
      loggerTesting.info('cli: command.validateAndRun');

      return command.validateAndRun(commandArgs);

    }).then(result => {
      instrumentation.stopAndReport('command', commandName, commandArgs);
      instrumentation.start('shutdown');
      // schedule this with `capture-exit` to ensure that
      // the shutdown instrumentation hook is invoked properly even if
      // we exit before hitting the `finally` below
      exit.onExit(shutdownOnExit);

      return result;

    }).then(result => {
      // if the help option was passed, call the help command
      if (result === 'callHelp') {
        helpOptions = {
          environment,
          commandName,
          commandArgs,
        };

        return this.callHelp(helpOptions);
      }

      return result;

    }).then(exitCode => {
      loggerTesting.info(`cli: command run complete. exitCode: ${exitCode}`);
      // TODO: fix this
      // Possibly this issue: https://github.com/joyent/node/issues/8329
      // Wait to resolve promise when running on windows.
      // This ensures that stdout is flushed so acceptance tests get full output

      return new Promise(resolve => {
        if (process.platform === 'win32') {
          setTimeout(resolve, 250, exitCode);
        } else {
          resolve(exitCode);
        }
      });
    });
  })
    .finally(() => {
      if (shutdownOnExit) {
        // invoke instrumentation shutdown and
        // remove from `capture-exit` callbacks
        shutdownOnExit();
        exit.offExit(shutdownOnExit);
      }
    })
    .catch(this.logError.bind(this));
};

/**
 * @private
 * @method callHelp
 * @param options
 * @return {Promise}
 */
CLI.prototype.callHelp = function(options) {
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
};

/**
 * @private
 * @method logError
 * @param error
 * @return {number}
 */
CLI.prototype.logError = function(error) {
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
};
