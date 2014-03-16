'use strict';

var fs = require('fs');
var ui = require('../ui');
var skeleton = require('../skeleton');
var stringUtil = require('../utilities/string');
var chalk = require('chalk');

module.exports.run = function run(appName) {
  if (arguments.length == 1) {
    ui.write(chalk.yellow('The `ember new` command requires an app-name to be specified.' +
                          ' For more details, use `ember help`.\n'));
    process.exit(1);
  }

  var name = stringUtil.classify(appName),
    dir = stringUtil.dasherize(name);

  try {
    fs.mkdirSync(dir);
    process.chdir(dir);
    ui.write(chalk.green('Created project directory: ' + dir));

    return skeleton.installInto(process.cwd(), name, false, false);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      ui.write(chalk.red('Error: "' + err));
    } else {
      ui.write(chalk.yellow('Directory \'' + dir + '\' already exists'));
    }

    process.exit(1);
  }
};

module.exports.usage = function usage() {
  return 'ember new ' + chalk.yellow('<app-name>');
};
