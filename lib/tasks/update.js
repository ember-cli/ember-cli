'use strict';

var Promise  = require('../ext/promise');
var chalk    = require('chalk');
var Task     = require('../models/task');
var fs       = require('fs');
var path     = require('path');

function npmInstall(npm) {
  return Promise.denodeify(npm.commands.install)(['ember-cli']);
}

module.exports = Task.extend({
  init: function() {
    this.npm = this.npm || require('npm');
  },

  run: function(options, updateInfo) {
    var env = options.environment || 'development';

    process.env.EMBER_ENV = process.env.EMBER_ENV || env;

    this.ui.write(chalk.yellow('\nA new version of ember-cli is available (' +
      updateInfo.newestVersion + ').\n'));

    var updatePrompt = {
      type: 'confirm',
      name: 'answer',
      message: 'Are you sure you want to update ember-cli?',
      choices: [
        { key: 'y', name: 'Yes, update', value: 'yes' },
        { key: 'n', name: 'No, cancel', value: 'no' }
      ]
    };

    return this.ui.prompt(updatePrompt).then(function(response) {
      if (response.answer === true) {
        return this.runNpmUpdate(updateInfo.newestVersion);
      }
    }.bind(this));
  },

  runNpmUpdate: function(newestVersion) {
    this.ui.pleasantProgress.start(chalk.green('Updating ember-cli'), chalk.green('.'));

    // first, run `npm install -g ember-cli`
    var npm = this.npm;
    var loadNPM = Promise.denodeify(npm.load);

    var stopProgress = (function() {
      this.ui.pleasantProgress.stop();
    }.bind(this));

    var reportFailure = (function(reason) {
      this.ui.write('There was an error – possibly a permissions issue. You ' +
                    'may need to manually run ' +
                    chalk.green('npm install -g ember-cli') + '.\n');
      throw reason;
    }.bind(this));

    var updateDependencies = (function() {
      var pkg = this.project.pkg;
      var packagePath = path.join(this.project.root, 'package.json');

      if (!pkg) {
        this.ui.write('There was an error locating your package.json file.');
        return false;
      }

      pkg.devDependencies['ember-cli'] = newestVersion;
      fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
      this.ui.write(chalk.green('\n✓ ember-cli was successfully updated!\n'));

      return this.showEmberInitPrompt();
    }.bind(this));

    return loadNPM({
        loglevel: 'silent',
        global: true
      })
      .then(npmInstall)
      .then(updateDependencies)
      .catch(reportFailure)
      .finally(stopProgress);
  },

  showEmberInitPrompt: function() {
    this.ui.write('To complete the update, you need to run ' +
      chalk.green('ember init') + ' in your project directory.\n');

    var initPrompt = {
      type: 'confirm',
      name: 'answer',
      message: 'Would you like to run ' + chalk.green('ember init') + ' now?',
      choices: [
        { key: 'y', name: 'Yes', value: 'yes' },
        { key: 'n', name: 'No', value: 'no' }
      ]
    };

    return this.ui.prompt(initPrompt).then(function(response) {
      if (response.answer === true) {
        var InitCommand = this.commands.Init;

        var initCommand = new InitCommand({
          ui: this.ui,
          analytics: this.analytics,
          tasks: this.tasks,
          project: this.project
        });

        return initCommand.run({}, []);
      }
    }.bind(this));
  }
});
