var fs = require('fs'),
    skeleton = require('../skeleton'),
    stringUtil = require('../utilities/string'),
    chalk = require('chalk');

module.exports.run = function run(options) {
  var args = options.argv.original,
    name = args.length === 2 ? stringUtil.classify(args[1]) : 'MyApp',
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
