'use strict';

var Promise  = require('../ext/promise');
var chalk    = require('chalk');
var Task     = require('../models/task');
var fs       = require('fs');

module.exports = Task.extend({
  run: function(options, updateInfo) {
    var env = options.environment || 'development';
    process.env.EMBER_ENV = process.env.EMBER_ENV || env;

    this.ui.write(chalk.yellow('\nA new version of ember-cli is available (' + updateInfo.newestVersion + ').\n'));

    var _this = this;
    var updatePrompt = {
      type: 'confirm',
      name: 'answer',
      message: 'This will update ember-cli via npm. Are you sure you want to update ember-cli?',
      choices: [
        { key: 'y', name: 'Yes, update', value: 'yes' },
        { key: 'n', name: 'No, cancel', value: 'no' }
      ]
    };

    return this.ui.prompt(updatePrompt).then(function(response) {
      if (response.answer === true) {
        _this.runNpmUpdate(updateInfo.newestVersion);
      }
    });
  },

  runNpmUpdate: function(newestVersion) {
    var _this = this;
    this.ui.pleasantProgress.start(chalk.green('Updating ember-cli'), chalk.green('.'));
    // first, run `npm install -g ember-cli`
    return new Promise(function(resolve, reject) {
      var npm = require('npm');
      npm.load({loglevel: 'silent', global: true}, function (err) {
        if (err) {
          reject(err);
        } else {
          npm.commands.install(['ember-cli'], function(err, data) {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        }
      });
    })
    .finally(function() {
      _this.ui.pleasantProgress.stop();
    })
    .then(function() {
      // update project's package.json file manually
      return new Promise(function(resolve, reject) {
        var packageFilePath = _this.project.root + '/package.json';

        if(!fs.existsSync(packageFilePath)) {
          reject();
        }

        var fileContent = fs.readFileSync(packageFilePath);
        var jsonContent = JSON.parse(fileContent);
        jsonContent.devDependencies['ember-cli'] = newestVersion;
        fs.writeFileSync(packageFilePath, JSON.stringify(jsonContent, null, 2));
        resolve();
      })
      .then(function() {
        _this.ui.write(chalk.green('\n✓ ember-cli was successfully updated!\n'));
        _this.showEmberInitPrompt();
      });
    }, function() {
      _this.ui.write('There was an error – possibly a permissions issue. You may need to manually run ' + chalk.green('npm install -g ember-cli') + '.\n');
    });
  },

  showEmberInitPrompt: function() {
    var _this = this;
    this.ui.write('To complete the update, you need to run ' + chalk.green('ember init') + ' in your project directory.\n');

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
        var InitCommand = _this.commands.Init;

        var initCommand = new InitCommand({
          ui: _this.ui,
          analytics: _this.analytics,
          tasks: _this.tasks,
          project: _this.project
        });

        initCommand.run({}, []);
      }
    });
  }

});
