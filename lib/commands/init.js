'use strict';

var blueprint = require('../blueprint');
var chalk = require('chalk');
var stringUtil = require('../utilities/string');
var path = require('path');
var isEmberCliProject = require('../utilities/is-ember-cli-project');
var ui = require('../ui');

module.exports.types = {
  dryRun: [Boolean]
};

module.exports.run = function run(rawName, options) {
  if (typeof rawName === 'object') {
    options = rawName;
    rawName = path.basename(options.appRoot);
  }

  if (isEmberCliProject()) {
    ui.write(chalk.yellow('Cannot run `ember init` inside of an existing ember-cli project.' +
                          ' For more details, use `ember help`.\n'));
    return;
  }

  var name = stringUtil.dasherize(rawName);
  var namespace = stringUtil.classify(rawName);

  return blueprint.installInto(options.appRoot, {
    name: name,
    modulePrefix: name,
    namespace: namespace
  },
    options['dry-run'],
    options['skip-npm-install']);
};

module.exports.usage = function usage() {
  return 'ember init ' + chalk.yellow('<app-name>');
};
