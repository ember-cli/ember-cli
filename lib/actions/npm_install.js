var Promise = require('rsvp').Promise,
    spawn = require('child_process').spawn,
    chalk = require('chalk'),
    PleasantProgress = require('../utilities/pleasant_progress'),
    npm = require('npm');

module.exports = function npmInstall() {
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
