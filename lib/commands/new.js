'use strict';

var fs = require('fs');
var ui = require('../ui');
var blueprint = require('../blueprint');
var stringUtil = require('../utilities/string');
var chalk = require('chalk');

module.exports.run = function run(rawName) {
  if (typeof rawName === 'object' || !rawName) {
    ui.write(chalk.yellow('The `ember new` command requires an app-name to be specified.' +
                          ' For more details, use `ember help`.\n'));
    return;
  }

  var name = stringUtil.dasherize(rawName);
  var namespace = stringUtil.classify(rawName);

  var dir = name;

  try {
    fs.mkdirSync(dir);
    process.chdir(dir);
    ui.write(chalk.green('Created project directory: ' + dir + '\n'));

    return blueprint.installInto(process.cwd(), {
      name: name,
      modulePrefix: name,
      namespace: namespace
    }, false, false);
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
