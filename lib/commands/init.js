'use strict';

var Blueprint  = require('../blueprint');
var chalk      = require('chalk');
var stringUtil = require('../utilities/string');
var path       = require('path');
var assert     = require('../utilities/assert');

module.exports.types = {
  dryRun: [Boolean]
};

module.exports.run = function run(options, ui) {
  var cwd     = process.cwd();
  var rawName = path.basename(cwd);

  assert('Due to an issue with `compileES6` an application name of `test` cannot be used.', rawName !== 'test');

  var name      = stringUtil.dasherize(rawName);
  var namespace = stringUtil.classify(rawName);

  var blueprint = new Blueprint(Blueprint.main, ui);

  return blueprint.install(cwd, {
      name: name,
      modulePrefix: name,
      namespace: namespace
    },
    options.cliOptions['dry-run'],
    options.cliOptions['skip-npm-install']);
};

module.exports.usage = function usage() {
  return 'ember init ' + chalk.yellow('<app-name>');
};
