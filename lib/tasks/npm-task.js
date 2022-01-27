'use strict';

// Runs `npm install` in cwd

const chalk = require('chalk');
const findUp = require('find-up');
const semver = require('semver');
const SilentError = require('silent-error');
const isYarnProject = require('../utilities/is-yarn-project');
const { NPM, YARN, PNPM, runCommand } = require('../utilities/package-managers');

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

  get packageManagerOutputName() {
    return this.packageManager.name;
  }

  hasYarnLock() {
    return isYarnProject(this.project.root);
  }

  async hasPNPMLock() {
    return Boolean(await findUp('pnpm-lock.yaml', { cwd: this.project.root }));
  }

  async checkYarn() {
    try {
      let result = await runCommand(YARN, ['--version']);
      let version = result.stdout;

      if (semver.gte(version, '2.0.0')) {
        logger.warn('yarn --version: %s', version);
        this.ui.writeWarnLine(`Yarn v2 is not fully supported. Proceeding with yarn: ${version}`);
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
      let result = await runCommand(PNPM, ['--version']);
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
      let result = await runCommand(NPM, ['--version']);
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
    if (packageManager === YARN) {
      logger.info('yarn requested -> trying yarn');
      return this.checkYarn();
    }

    if (packageManager === NPM) {
      logger.info('npm requested -> using npm');
      return this.checkNpmVersion();
    }

    if (packageManager === PNPM) {
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
      await runCommand(this.packageManager, this.command, options);
    } finally {
      ui.stopProgress();
    }

    ui.writeLine(chalk.green(completeMessage));
  }

  formatStartMessage(/* packages */) {
    return '';
  }

  formatCompleteMessage(/* packages */) {
    return '';
  }
}

module.exports = NpmTask;
