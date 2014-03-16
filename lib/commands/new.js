'use strict';

var fs = require('fs');
var ui = require('../ui');
var skeleton = require('../skeleton');
var stringUtil = require('../utilities/string');
var chalk = require('chalk');

module.exports.run = function run(rawName) {
  if (!rawName) {
    ui.write(chalk.yellow('The `ember new` command requires an app-name to be specified.' +
                          ' For more details, use `ember help`.\n'));
  }

  var name = stringUtil.classify(rawName);
  var dir = stringUtil.dasherize(name);

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
  }
};

module.exports.usage = function usage() {
  return 'ember new ' + chalk.yellow('<app-name>');
};
