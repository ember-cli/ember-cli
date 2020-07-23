'use strict';

// Runs `npm install` in cwd

const chalk = require('chalk');
const execa = require('../utilities/execa');
const semver = require('semver');
const SilentError = require('silent-error');
const isYarnProject = require('../utilities/is-yarn-project');

const logger = require('heimdalljs-logger')('ember-cli:npm-task');

const Task = require('../models/task');

class NpmTask extends Task {
  /**
   * @private
   * @class NpmTask
   * @constructor
   * @param {Object} options
   */
  constructor(options) {
    super(options);

    // The command to run: can be 'install' or 'uninstall'
    this.command = '';

    this.versionConstraints = '3 || 4 || 5 || 6';
  }

  npm(args) {
    logger.info('npm: %j', args);
    return execa('npm', args, { preferLocal: false });
  }

  yarn(args) {
    logger.info('yarn: %j', args);
    return execa('yarn', args, { preferLocal: false });
  }

  hasYarnLock() {
    return isYarnProject(this.project.root);
  }

  async checkYarn() {
    try {
      let result = await this.yarn(['--version']);
      let version = result.stdout;

      if (semver.gte(version, '2.0.0')) {
        logger.warn('yarn --version: %s', version);
        this.ui.writeWarnLine(`Yarn v2 is not fully supported. Proceeding with yarn: ${version}`);
      } else {
        logger.info('yarn --version: %s', version);
      }

      this.useYarn = true;

      return { yarnVersion: version };
    } catch (error) {
      logger.error('yarn --version failed: %s', error);

      if (error.code === 'ENOENT') {
        throw new SilentError(
          'Ember CLI is now using yarn, but was not able to find it.\n' +
            'Please install yarn using the instructions at https://classic.yarnpkg.com/en/docs/install'
        );
      }

      throw error;
    }
  }

  async checkNpmVersion() {
    try {
      let result = await this.npm(['--version']);
      let version = result.stdout;
      logger.info('npm --version: %s', version);

      let ok = semver.satisfies(version, this.versionConstraints);
      if (!ok) {
        logger.warn('npm --version is outside of version constraint: %s', this.versionConstraints);

        let below = semver.ltr(version, this.versionConstraints);
        if (below) {
          throw new SilentError(
            'Ember CLI is now using the global npm, but your npm version is outdated.\n' +
              'Please update your global npm version by running: npm install -g npm'
          );
        }

        this.ui.writeWarnLine(
          'Ember CLI is using the global npm, but your npm version has not yet been ' +
            'verified to work with the current Ember CLI release.'
        );
      }

      return { npmVersion: version };
    } catch (error) {
      logger.error('npm --version failed: %s', error);

      if (error.code === 'ENOENT') {
        throw new SilentError(
          'Ember CLI is now using the global npm, but was not able to find it.\n' +
            'Please install npm using the instructions at https://github.com/npm/npm'
        );
      }

      throw error;
    }
  }

  /**
   * This method will determine what package manager (npm or yarn) should be
   * used to install the npm dependencies.
   *
   * Setting `this.useYarn` to `true` or `false` will force the use of yarn
   * or npm respectively.
   *
   * If `this.useYarn` is not set we check if `yarn.lock` exists and if
   * `yarn` is available and in that case set `useYarn` to `true`.
   *
   * @private
   * @method findPackageManager
   * @return {Promise}
   */
  async findPackageManager() {
    if (this.useYarn === true) {
      logger.info('yarn requested -> trying yarn');
      return this.checkYarn();
    }

    if (this.useYarn === false) {
      logger.info('npm requested -> using npm');
      return this.checkNpmVersion();
    }

    if (!this.hasYarnLock()) {
      logger.info('yarn.lock not found -> using npm');
      return this.checkNpmVersion();
    }

    logger.info('yarn.lock found -> trying yarn');
    try {
      const yarnResult = await this.checkYarn();
      logger.info('yarn found -> using yarn');
      return yarnResult;
    } catch (_err) {
      logger.info('yarn not found -> using npm');
      return this.checkNpmVersion();
    }
  }

  async run(options) {
    this.useYarn = options.useYarn;

    let result = await this.findPackageManager();
    let ui = this.ui;
    let startMessage = this.formatStartMessage(options.packages);
    let completeMessage = this.formatCompleteMessage(options.packages);

    const prependEmoji = require('../../lib/utilities/prepend-emoji');

    ui.writeLine('');
    ui.writeLine(prependEmoji('🚧', 'Installing packages... This might take a couple of minutes.'));
    ui.startProgress(chalk.green(startMessage));

    let promise;
    if (this.useYarn) {
      this.yarnVersion = result.yarnVersion;
      let args = this.toYarnArgs(this.command, options);
      promise = this.yarn(args);
    } else {
      let args = this.toNpmArgs(this.command, options);
      promise = this.npm(args);

      // as of 2018-10-09 npm 5 and 6 _break_ the hierarchy of `node_modules`
      // after a `npm install foo` (deletes files/folders other than
      // what was directly installed) in some circumstances, see:
      //
      // * https://github.com/npm/npm/issues/16853
      // * https://github.com/npm/npm/issues/17379
      //
      // this ensures that we run a full `npm install` **after** any `npm
      // install foo` runs to ensure that we have a fully functional
      // node_modules hierarchy
      if (result.npmVersion && semver.lt(result.npmVersion, '5.7.1')) {
        promise = promise.then(() => this.npm(['install']));
      }
    }

    return promise.finally(() => ui.stopProgress()).then(() => ui.writeLine(chalk.green(completeMessage)));
  }

  toNpmArgs(command, options) {
    let args = [command];

    if (options.save) {
      args.push('--save');
    }

    if (options['save-dev']) {
      args.push('--save-dev');
    }

    if (options['save-exact']) {
      args.push('--save-exact');
    }

    if ('optional' in options && !options.optional) {
      args.push('--no-optional');
    }

    if (options.verbose) {
      args.push('--loglevel verbose');
    } else {
      args.push('--loglevel error');
    }

    if (options.packages) {
      args = args.concat(options.packages);
    }

    return args;
  }

  toYarnArgs(command, options) {
    let args = [];

    if (command === 'install') {
      if (options.save) {
        args.push('add');
      } else if (options['save-dev']) {
        args.push('add', '--dev');
      } else if (options.packages) {
        throw new Error(`npm command "${command} ${options.packages.join(' ')}" can not be translated to Yarn command`);
      } else {
        args.push('install');
      }

      if (options['save-exact']) {
        args.push('--exact');
      }

      if ('optional' in options && !options.optional) {
        args.push('--ignore-optional');
      }
    } else if (command === 'uninstall') {
      args.push('remove');
    } else {
      throw new Error(`npm command "${command}" can not be translated to Yarn command`);
    }

    if (options.verbose) {
      args.push('--verbose');
    }

    if (options.packages) {
      args = args.concat(options.packages);
    }

    // Yarn v2 defaults to non-interactive
    // with an optional -i flag

    if (semver.lt(this.yarnVersion, '2.0.0')) {
      args.push('--non-interactive');
    }

    return args;
  }

  formatStartMessage(/* packages */) {
    return '';
  }

  formatCompleteMessage(/* packages */) {
    return '';
  }
}

module.exports = NpmTask;
