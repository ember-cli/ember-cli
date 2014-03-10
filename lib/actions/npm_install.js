var Promise = require('rsvp').Promise,
    spawn = require('child_process').spawn,
    chalk = require('chalk'),
    PleasantProgress = require('../utilities/pleasant_progress'),
    npm = require('npm');

module.exports = function npmInstall() {
  return new Promise(function (resolve, reject) {

    npm.load(function(err) {
      if (err) {
        console.log(chalk.red('Error loading npm'));
        reject(err);
      } else {
        console.log(chalk.green('Installing project dependencies'));
        npm.install(function(installError) {
          if (installError) {
            console.log(chalk.red('Error running npm install'));
            reject(installError);
          } else {
            console.log(chalk.green('Dependencies Installed'));
            resolve(0);
          }
        });
      }
    });
  }, 'postInstall: running `npm install`');
};
