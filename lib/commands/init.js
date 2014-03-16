var path = require('path');
var skeleton = require('../skeleton');
var chalk = require('chalk');

module.exports.types = {
  dryRun: [Boolean]
};

module.exports.run = function run(name, options) {
  if (typeof name === 'object') {
    options = name;
    name = undefined;
  }

  var defaultName = path.basename(process.cwd());

  return skeleton.installInto(options.appRoot, name || defaultName,
    options['dry-run'],
    options['skip-npm-install']);
};

module.exports.usage = function usage() {
  return 'ember init ' + chalk.yellow('<app-name>');
};
