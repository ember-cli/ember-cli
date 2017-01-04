'use strict';

var Promise = require('../../lib/ext/promise');
var Task = require('../models/task');
var _exec = Promise.denodeify(require('child_process').exec);
var path = require('path');
var pkg = require('../../package.json');
var fs = require('fs');

var gitEnvironmentVariables = {
  GIT_AUTHOR_NAME: 'Tomster',
  GIT_AUTHOR_EMAIL: 'tomster@emberjs.com',
  get GIT_COMMITTER_NAME() { return this.GIT_AUTHOR_NAME; },
  get GIT_COMMITTER_EMAIL() { return this.GIT_AUTHOR_EMAIL; },
};

module.exports = Task.extend({
  init(_options) {
    var options = _options || {};
    options.exec = options.exec || _exec;
    this._super.init.apply(this, arguments);
  },

  run(_commandOptions) {
    var commandOptions = _commandOptions || {};
    var template = require('lodash.template');
    var chalk = require('chalk');
    var ui = this.ui;
    var exec = this.exec;

    if (commandOptions.skipGit) {
      return Promise.resolve();
    }

    var gitVersionWorked = false;
    return exec('git --version').then(() => {
      gitVersionWorked = true;

      return exec('git init')
        .then(() => exec('git add .'))
        .then(() => {
          var commitTemplate = fs.readFileSync(path.join(__dirname, '../utilities/COMMIT_MESSAGE.txt'));
          var commitMessage = template(commitTemplate)(pkg);
          return exec(`git commit -m "${commitMessage}"`, { env: gitEnvironmentVariables });
        })
        .then(() => ui.writeLine(chalk.green('Successfully initialized git.')));
    })
      .catch(error => {
        if (gitVersionWorked) {
          throw error;
        }
        // otherwise git version failed, so we skip git stuff.
      });
  },
});
