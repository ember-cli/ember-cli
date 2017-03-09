'use strict';

const RSVP = require('rsvp');
const Task = require('../models/task');
const path = require('path');
const pkg = require('../../package.json');
const fs = require('fs');

const Promise = RSVP.Promise;
const _exec = RSVP.denodeify(require('child_process').exec);

class GitInitTask extends Task {
  constructor(_options) {
    let options = _options || {};
    options.exec = options.exec || _exec;
    super(options);
  }

  run(_commandOptions) {
    let commandOptions = _commandOptions || {};
    const template = require('lodash.template');
    const chalk = require('chalk');
    let ui = this.ui;
    let exec = this.exec;

    if (commandOptions.skipGit) {
      return Promise.resolve();
    }

    let gitVersionWorked = false;
    return exec('git --version').then(() => {
      gitVersionWorked = true;

      return exec('git init')
        .then(() => exec('git add .'))
        .then(() => {
          let commitTemplate = fs.readFileSync(path.join(__dirname, '../utilities/COMMIT_MESSAGE.txt'));
          let commitMessage = template(commitTemplate)(pkg);
          return exec(`git commit -m "${commitMessage}"`, { env: this.buildGitEnvironment() });
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
