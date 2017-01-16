'use strict';

// Runs `bower install` in cwd
const path = require('path');
const existsSync = require('exists-sync');
const execa = require('execa');
const RSVP = require('rsvp');
const Task = require('../models/task');
const formatPackageList = require('../utilities/format-package-list');

const logger = require('heimdalljs-logger')('ember-cli:tasks:bower-install');

const Promise = RSVP.Promise;
const resolve = RSVP.denodeify(require('resolve'));

const cliPath = path.resolve(`${__dirname}/../..`);

class BowerInstallTask extends Task {

  resolveBower() {
    logger.info('Resolving "bower" from %s ...', cliPath);
    return resolve('bower', { basedir: cliPath });
  }

  ensureBower() {
    if (this.bower) {
      return Promise.resolve(this.bower);
    }

    return this.resolveBower()
      .catch(() => this.installBower()
        .then(() => this.resolveBower()))
      .then(bowerPath => {
        logger.info('Resolved "bower" to: %s', bowerPath);
        return require(bowerPath);
      });
  }

  installBower() {
    logger.info('Installing "bower" via NPM into: %s', cliPath);

    let ui = this.ui;
    const chalk = require('chalk');

    ui.startProgress(chalk.green('NPM: Installing bower ...'));

    return Promise.resolve(execa('npm', ['install', 'bower@^1.3.12'], { cwd: cliPath }))
      .finally(() => ui.stopProgress())
      .then(() => ui.writeLine(chalk.green('NPM: Installed bower')));
  }

  // Options: Boolean verbose
  run(options) {
    let bowerJson = path.join(this.project.root, '/bower.json');
    let ui = this.ui;

    if (!existsSync(bowerJson)) {
      ui.writeWarnLine('Skipping bower install: bower.json not found');
      return Promise.resolve();
    }

    return this.ensureBower().then(bower => {
      const chalk = require('chalk');
      let bowerConfig = this.bowerConfig || require('bower-config');
      let packages = options.packages || [];
      let installOptions = options.installOptions || { save: true };

      let startMessage = this.formatStartMessage(packages);
      let completeMessage = this.formatCompleteMessage(packages);

      logger.info('Installing %j via Bower with options: %j', packages, installOptions);

      ui.startProgress(chalk.green(startMessage));

      let config = bowerConfig.read();
      config.interactive = true;

      return new Promise((resolve, reject) => {
        bower.commands.install(packages, installOptions, config) // Packages, options, config
          .on('log', logBowerMessage)
          .on('prompt', ui.prompt.bind(ui))
          .on('error', reject)
          .on('end', resolve);
      })
        .finally(() => ui.stopProgress())
        .then(() => ui.writeLine(chalk.green(completeMessage)));

      function logBowerMessage(message) {
        if (message.level === 'conflict') {
          // e.g.
          //   conflict Unable to find suitable version for ember-data
          //     1) ember-data 1.0.0-beta.6
          //     2) ember-data ~1.0.0-beta.7
          ui.writeLine(`  ${chalk.red('conflict')} ${message.message}`);
          message.data.picks.forEach((pick, index) => {
            ui.writeLine(`    ${chalk.green(`${index + 1})`)} ${message.data.name} ${pick.endpoint.target}`);
          });
        } else if (message.level === 'info' && options.verbose) {
          // e.g.
          //   cached git://example.com/some-package.git#1.0.0
          ui.writeLine(`  ${chalk.green(message.id)} ${message.message}`);
        }
      }
    });
  }

  formatStartMessage(packages) {
    return `Bower: Installing ${formatPackageList(packages)} ...`;
  }

  formatCompleteMessage(packages) {
    return `Bower: Installed ${formatPackageList(packages)}`;
  }
}

module.exports = BowerInstallTask;
