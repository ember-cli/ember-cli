var path = require('path'),
    skeleton = require('../skeleton'),
    adapt = require('../adapters'),
    chalk = require('chalk');

var root = path.resolve(path.join(__dirname, '..', '..'));

module.exports.options = {
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
}
