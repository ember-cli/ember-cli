'use strict';

var Blueprint = require('../blueprint');
var chalk = require('chalk');
var stringUtil = require('../utilities/string');
var path = require('path');

module.exports.types = {
  dryRun: [Boolean]
};

module.exports.run = function run(options, ui) {
  var cwd = process.cwd();
  var rawName = path.basename(cwd);

  var name = stringUtil.dasherize(rawName);
  var namespace = stringUtil.classify(rawName);

  var blueprint = new Blueprint(Blueprint.main, ui);

  return blueprint.install(cwd, {
      name: name,
      modulePrefix: name,
      namespace: namespace
    },
      options.options['dry-run'],
      options.options['skip-npm-install']);
};

module.exports.usage = function usage() {
  return 'ember init ' + chalk.yellow('<app-name>');
};
