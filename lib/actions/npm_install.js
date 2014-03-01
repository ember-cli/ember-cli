var Promise = require('rsvp').Promise,
    spawn = require('child_process').spawn,
    chalk = require('chalk');

module.exports = function npmInstall() {
  return new Promise(function (resolve, reject) {
    var npmInstall = spawn('npm', ['install']);

    npmInstall.stdout.setEncoding('utf8');

    process.stdout.write(chalk.green('Installing project dependencies..'));

    npmInstall.stdout.on('data', function (data) {
      process.stdout.write(chalk.green('.'));
      // TODO: verbose mode can print out more. (likely allowing npm and friends to just spit to the console);
    });

    npmInstall.stderr.on('data', function (data) {
      process.stdout.write(chalk.green('.'));
      // TODO: verbose mode can print out more. (likely allowing npm and friends to just spit to the console);
    });

    npmInstall.on('close', function (code) {
      if (code !== 0) {
        console.log(chalk.red('postInstall: error encoutered, exiting with error code: ' + code));
        reject(code);
      } else {
        process.stderr.write(chalk.green("done\n"));
        resolve(0);
      }
    });
  }, 'postInstall: running `npm install`');
};
