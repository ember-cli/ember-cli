'use strict';

const Task = require('../models/task');
const path = require('path');
const pkg = require('../../package.json');
const fs = require('fs');
const execa = require('../utilities/execa');

module.exports = class GitInitTask extends Task {
  async run(_commandOptions) {
    let commandOptions = _commandOptions || {};
    const chalk = require('chalk');
    let ui = this.ui;

    if (commandOptions.skipGit) {
      return;
    }

    let hasGit = true;
    try {
      await this._gitVersion();
    } catch (e) {
      hasGit = false;
    }
    if (!hasGit) {
      return;
    }
    const prependEmoji = require('../../lib/utilities/prepend-emoji');
    ui.writeLine('');
    ui.writeLine(prependEmoji('🎥', 'Initializing git repository.'));
    await this._gitInit();
    await this._gitAdd();
    await this._gitCommit();
    ui.writeLine(chalk.green('Git: successfully initialized.'));
  }

  _gitVersion() {
    return execa('git', ['--version']);
  }

  _gitInit() {
    return execa('git', ['init']);
  }

  _gitAdd() {
    return execa('git', ['add', '.']);
  }

  async _gitCommit() {
    const template = require('lodash.template');
    let commitTemplate = fs.readFileSync(path.join(__dirname, '../utilities/COMMIT_MESSAGE.txt'));
    let commitMessage = template(commitTemplate)(pkg);
    let env = this.buildGitEnvironment();

    try {
      return await execa('git', ['commit', '-m', commitMessage], { env });
    } catch (error) {
      if (isError(error) && error.message.indexOf('git config --global user') > -1) {
        env.GIT_COMMITTER_NAME = 'Tomster';
        env.GIT_COMMITTER_EMAIL = 'tomster@emberjs.com';
        return execa('git', ['commit', '-m', commitMessage], { env });
      }

      throw error;
    }
  }

  buildGitEnvironment() {
    // Make sure we merge in the current environment so that git has access to
    // important environment variables like $HOME.
    return Object.assign({}, process.env, {
      GIT_AUTHOR_NAME: 'Tomster',
      GIT_AUTHOR_EMAIL: 'tomster@emberjs.com',
    });
  }
};

function isError(error) {
  return typeof error === 'object' && error !== null && typeof error.message === 'string';
}
