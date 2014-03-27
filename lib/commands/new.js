'use strict';

var fs = require('fs');
var Blueprint = require('../blueprint');
var stringUtil = require('../utilities/string');
var chalk = require('chalk');
var isEmberCliProject = require('../utilities/is-ember-cli-project');

module.exports.run = function run(options, ui) {
  var rawName = options.args[0];

  if (isEmberCliProject()) {
    ui.write(chalk.yellow('Cannot run `ember new` inside of an existing ember-cli project.' +
                          ' For more details, use `ember help`.\n'));
    return;
  }

  if (!rawName) {
    ui.write(chalk.yellow('The `ember new` command requires an app-name to be specified.' +
                          ' For more details, use `ember help`.\n'));
    return;
  }

  var name = stringUtil.dasherize(rawName);
  var namespace = stringUtil.classify(rawName);
  var dir = rawName;

  try {
    fs.mkdirSync(dir);
    process.chdir(dir);
    ui.write(chalk.green('Created project directory: ' + dir + '\n'));

    var blueprint = new Blueprint(Blueprint.main, ui);

    return blueprint.install(process.cwd(), {
        name: name,
        modulePrefix: name,
        namespace: namespace
      },
      options.options['dry-run'],
      options.options['skip-npm-install']
    );
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
