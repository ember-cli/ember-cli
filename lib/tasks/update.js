'use strict';

var Promise  = require('../ext/promise');
var chalk    = require('chalk');
var Task     = require('../models/task');
var fs       = require('fs');

module.exports = Task.extend({
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
        this.runNpmUpdate(updateInfo.newestVersion);
      }
    }.bind(this));
  },

  runNpmUpdate: function(newestVersion) {
    this.ui.pleasantProgress.start(chalk.green('Updating ember-cli'), chalk.green('.'));
    // first, run `npm install -g ember-cli`
    var npm = require('npm');
    var loadNPM = Promise.denodeify(npm.load);
    loadNPM({loglevel: 'silent', global: true})
    .then(function(npm) {
      var npmInstall = Promise.denodeify(npm.commands.install);
      return npmInstall(['ember-cli']);
    }.bind(this))
    .then(function() {
      // update project's package.json file manually
      var packageFilePath = this.project.root + '/package.json';

      if(!fs.existsSync(packageFilePath)) {
        this.ui.write('There was an error locating your package.json file.');
        return false;
      }

      var fileContent = fs.readFileSync(packageFilePath);
      var jsonContent = JSON.parse(fileContent);

      jsonContent.devDependencies['ember-cli'] = newestVersion;
      fs.writeFileSync(packageFilePath, JSON.stringify(jsonContent, null, 2));
      this.ui.write(chalk.green('\n✓ ember-cli was successfully updated!\n'));
      this.showEmberInitPrompt();
    }.bind(this))
    .catch(function() {
      this.ui.write('There was an error – possibly a permissions issue. You ' +
        'may need to manually run ' +
        chalk.green('npm install -g ember-cli') + '.\n');
    }.bind(this))
    .finally(function() {
      this.ui.pleasantProgress.stop();
    }.bind(this));
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

        initCommand.run({}, []);
      }
    }.bind(this));
  }

});
