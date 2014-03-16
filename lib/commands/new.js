var path = require('path'),
    fs = require('fs'),
    RSVP = require('rsvp'),
    skeleton = require('../skeleton'),
    stringUtil = require('../utilities/strings'),
    chalk = require('chalk');

module.exports.run = function run(options) {
  var name = stringUtil.camelize(options.argv.original[1]) || 'App',
    dir = stringUtil.dasherize(name);

  try {
    fs.mkdirSync(dir);
    process.chdir(dir);
    console.log(chalk.green('Created project directory: ' + dir));

    return skeleton.installInto(process.cwd(), name, false, false);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      console.error('Error: "' + err);
    } else {
      console.log(chalk.yellow('Directory \'' + dir + '\' already exists'));
    }

    process.exit(1);
  }
};

module.exports.usage = function usage() {
  return 'ember new ' + chalk.yellow('<app-name>');
};
