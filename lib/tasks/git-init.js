'use strict';

const RSVP = require('rsvp');
const Task = require('../models/task');
const path = require('path');
const pkg = require('../../package.json');
const fs = require('fs');
const execa = require('../utilities/execa');

const Promise = RSVP.Promise;

class GitInitTask extends Task {
  run(_commandOptions) {
    let commandOptions = _commandOptions || {};
    const template = require('lodash.template');
    const chalk = require('chalk');
    let ui = this.ui;

    if (commandOptions.skipGit) {
      return Promise.resolve();
    }

    let gitVersionWorked = false;
    return this._gitVersion().then(() => {
      gitVersionWorked = true;

      return this._gitInit()
        .then(() => this._gitAdd())
        .then(() => {
          let commitTemplate = fs.readFileSync(path.join(__dirname, '../utilities/COMMIT_MESSAGE.txt'));
          let commitMessage = template(commitTemplate)(pkg);
          return this._gitCommit(commitMessage);
        })
        .then(() => ui.writeLine(chalk.green('Successfully initialized git.')));
    })
      .catch(error => {
        if (gitVersionWorked) {
          throw error;
        }
        // otherwise git version failed, so we skip git stuff.
      });
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

  _gitCommit(commitMessage) {
    return execa('git', ['commit', '-m', commitMessage], { env: this.buildGitEnvironment() });
  }

  buildGitEnvironment() {
    // Make sure we merge in the current environment so that git has access to
    // important environment variables like $HOME.
    return Object.assign({}, process.env, {
      GIT_AUTHOR_NAME: 'Tomster',
      GIT_AUTHOR_EMAIL: 'tomster@emberjs.com',
      GIT_COMMITTER_NAME: 'Tomster',
      GIT_COMMITTER_EMAIL: 'tomster@emberjs.com',
    });
  }
}

module.exports = GitInitTask;
