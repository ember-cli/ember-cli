'use strict';

// Runs `npm install` in cwd

const chalk = require('chalk');
const execa = require('execa');
const semver = require('semver');
const RSVP = require('rsvp');
const SilentError = require('silent-error');

const logger = require('heimdalljs-logger')('ember-cli:npm-task');

const Task = require('../models/task');

class NpmTask extends Task {

  constructor(options) {
    super(options);

    // The command to run: can be 'install' or 'uninstall'
    this.command = '';

    this.versionConstraints = '3 || 4';
  }

  npm(args) {
    logger.info('npm: %j', args);
    return RSVP.resolve(execa('npm', args, { preferLocal: false }));
  }

  checkVersion() {
    return this.npm(['--version']).then(result => {
      let version = result.stdout;
      logger.info('npm --version: %s', version);

      let ok = semver.satisfies(version, this.versionConstraints);
      if (!ok) {
        logger.warn('npm --version is outside of version constraint: %s', this.versionConstraints);

        let below = semver.ltr(version, this.versionConstraints);
        if (below) {
          throw new SilentError('Ember CLI is now using the global NPM, but your NPM version is outdated.\n' +
            'Please update your global NPM version by running: npm install -g npm');
        }

        this.ui.writeWarnLine('Ember CLI is using the global NPM, but your NPM version has not yet been ' +
          'verified to work with the current Ember CLI release.');
      }

    }).catch(error => {
      logger.error('npm --version failed: %s', error);

      if (error.code === 'ENOENT') {
        throw new SilentError('Ember CLI is now using the global NPM, but was not able to find it.\n' +
          'Please install NPM using the instructions at https://github.com/npm/npm');
      }

      throw error;
    });
  }

  run(options) {
    return this.checkVersion().then(() => {

      let ui = this.ui;
      let startMessage = this.formatStartMessage(options.packages);
      let completeMessage = this.formatCompleteMessage(options.packages);

      ui.startProgress(chalk.green(startMessage));

      let args = [this.command];

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

      return this.npm(args)
        .finally(() => ui.stopProgress())
        .then(() => ui.writeLine(chalk.green(completeMessage)));
    });
  }

  formatStartMessage(/* packages */) {
    return '';
  }

  formatCompleteMessage(/* packages */) {
    return '';
  }
}

module.exports = NpmTask;
