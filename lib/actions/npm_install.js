var Promise = require('rsvp').Promise,
    spawn = require('child_process').spawn,
    chalk = require('chalk'),
    PleasantProgress = require('../utilities/pleasant_progress');

module.exports = function npmInstall() {
  return new Promise(function (resolve, reject) {
    // TODO: prefer an NPM api
    var npmInstall = spawn('npm', ['install']);

    var progress = new PleasantProgress({
      message: chalk.green('Installing project dependencies'),
      rate: 500,
      stepString: chalk.green('.')
    });

    npmInstall.stdout.setEncoding('utf8');

    progress.start();

    npmInstall.stdout.on('data', function() { });
    npmInstall.stderr.on('data', function() { });

    npmInstall.on('close', function (code) {
      progress.stop();
      if (code !== 0) {
        console.log(chalk.red('postInstall: error encoutered, exiting with error code: ' + code));
        reject(code);
      } else {
        process.stdout.write(chalk.green('Dependencies installed.\n'));
        resolve(0);
      }
    });
  }, 'postInstall: running `npm install`');
};
