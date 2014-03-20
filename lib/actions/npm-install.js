'use strict';

var Promise = require('rsvp').Promise;
var chalk = require('chalk');
var PleasantProgress = require('../utilities/pleasant-progress');

module.exports = function npmInstall() {
  var npm = require('npm');
  return new Promise(function (resolve, reject) {

    var progress = new PleasantProgress({
      message: chalk.green('Installing project dependencies'),
      rate: 500,
      stepString: chalk.green('.')
    });

    progress.start();

    npm.load({
      loglevel: 'error' // TODO: inherit based on global verbosity
    }, function(err) {

      if (err) {
        console.log(chalk.red('Error loading npm'));
        reject(err);
      } else {

        npm.install(function(installError) {
          progress.stop();
          process.stdout.write('\n');
          if (installError) {
            console.log(chalk.red('Error running npm install'));
            reject(installError);
          } else {
            process.stdout.write(chalk.green('Dependencies installed.\n'));
            resolve(0);
          }
        });
      }
    });
  }, 'postInstall: running `npm install`');
};
