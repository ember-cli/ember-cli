var fs = require('fs'),
    ui = require('../ui'),
    skeleton = require('../skeleton'),
    stringUtil = require('../utilities/string'),
    chalk = require('chalk');

module.exports.run = function run(options) {
  if (options.argv.original.length === 1) {
    ui.write(chalk.yellow('The `ember new` command requires an app-name to be specified.' +
                          ' For more details, use `ember help`.\n'));
    process.exit(1);
  }

  var name = stringUtil.classify(options.argv.original[1]),
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
