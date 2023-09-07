'use strict';

const chalk = require('chalk');
const execa = require('../utilities/execa');
const semver = require('semver');
const SilentError = require('silent-error');
const { isPnpmProject, isYarnProject } = require('../utilities/package-managers');

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
  }

  get packageManagerOutputName() {
    return this.packageManager.name;
  }

  npm(args) {
    logger.info('npm: %j', args);
    return execa('npm', args, { preferLocal: false });
  }

  yarn(args) {
    logger.info('yarn: %j', args);
    return execa('yarn', args, { preferLocal: false });
  }

  pnpm(args) {
    logger.info('pnpm: %j', args);
    return execa('pnpm', args, { preferLocal: false });
  }

  hasYarnLock() {
    return isYarnProject(this.project.root);
  }

  hasPNPMLock() {
    return isPnpmProject(this.project.root);
  }

  async checkYarn() {
    try {
      let result = await this.yarn(['--version']);
      let version = result.stdout;

      if (semver.gte(version, '2.0.0')) {
        logger.warn('yarn --version: %s', version);
        let yarnConfig = await this.yarn(['config', 'get', 'nodeLinker']);
        let nodeLinker = yarnConfig.stdout.trim();
        if (nodeLinker !== 'node-modules') {
          this.ui.writeWarnLine(`Yarn v2 is not fully supported. Proceeding with yarn: ${version}`);
        }
      } else {
        logger.info('yarn --version: %s', version);
      }

      return { name: 'yarn', version };
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

  async checkPNPM() {
    try {
      let result = await this.pnpm(['--version']);
      let version = result.stdout;

      logger.info('pnpm --version: %s', version);

      return { name: 'pnpm', version };
    } catch (error) {
      logger.error('pnpm --version failed: %s', error);

      if (error.code === 'ENOENT') {
        throw new SilentError(
          'Ember CLI is now using pnpm, but was not able to find it.\n' +
            'Please install pnpm using the instructions at https://pnpm.io/installation'
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

      return { name: 'npm', version };
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
  async findPackageManager(packageManager = null) {
    if (packageManager === 'yarn') {
      logger.info('yarn requested -> trying yarn');
      return this.checkYarn();
    }

    if (packageManager === 'npm') {
      logger.info('npm requested -> using npm');
      return this.checkNpmVersion();
    }

    if (packageManager === 'pnpm') {
      logger.info('pnpm requested -> using pnpm');
      return this.checkPNPM();
    }

    if (this.hasYarnLock()) {
      logger.info('yarn.lock found -> trying yarn');
      try {
        const yarnResult = await this.checkYarn();
        logger.info('yarn found -> using yarn');
        return yarnResult;
      } catch (_err) {
        logger.info('yarn not found');
      }
    } else {
      logger.info('yarn.lock not found');
    }

    if (await this.hasPNPMLock()) {
      logger.info('pnpm-lock.yaml found -> trying pnpm');
      try {
        let result = await this.checkPNPM();
        logger.info('pnpm found -> using pnpm');
        return result;
      } catch (_err) {
        logger.info('pnpm not found');
      }
    } else {
      logger.info('pnpm-lock.yaml not found');
    }

    logger.info('using npm');
    return this.checkNpmVersion();
  }

  async run(options) {
    this.packageManager = await this.findPackageManager(options.packageManager);

    let ui = this.ui;
    let startMessage = this.formatStartMessage(options.packages);
    let completeMessage = this.formatCompleteMessage(options.packages);

    const prependEmoji = require('../../lib/utilities/prepend-emoji');

    ui.writeLine('');
    ui.writeLine(prependEmoji('🚧', 'Installing packages... This might take a couple of minutes.'));
    ui.startProgress(chalk.green(startMessage));

    try {
      if (this.packageManager.name === 'yarn') {
        let args = this.toYarnArgs(this.command, options);
        await this.yarn(args);
      } else if (this.packageManager.name === 'pnpm') {
        let args = this.toPNPMArgs(this.command, options);
        await this.pnpm(args);
      } else {
        let args = this.toNpmArgs(this.command, options);
        await this.npm(args);
      }
    } finally {
      ui.stopProgress();
    }

    ui.writeLine(chalk.green(completeMessage));
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
      args.push('--loglevel', 'verbose');
    } else {
      args.push('--loglevel', 'error');
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

    if (semver.lt(this.packageManager.version, '2.0.0')) {
      args.push('--non-interactive');
    }

    return args;
  }

  toPNPMArgs(command, options) {
    let args = [];

    if (command === 'install') {
      if (options.save) {
        args.push('add');
      } else if (options['save-dev']) {
        args.push('add', '--save-dev');
      } else if (options.packages) {
        throw new Error(`npm command "${command} ${options.packages.join(' ')}" can not be translated to pnpm command`);
      } else {
        args.push('install');
      }

      if (options['save-exact']) {
        args.push('--save-exact');
      }
    } else if (command === 'uninstall') {
      args.push('remove');
    } else {
      throw new Error(`npm command "${command}" can not be translated to pnpm command`);
    }

    if (options.packages) {
      args = args.concat(options.packages);
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
