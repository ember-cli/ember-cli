'use strict';

var RSVP              = require('rsvp');
var Promise           = RSVP.Promise;
var mkdir             = RSVP.denodeify(require('fs').mkdir);
var Blueprint         = require('../blueprint');
var stringUtil        = require('../utilities/string');
var chalk             = require('chalk');
var isEmberCliProject = require('../utilities/is-ember-cli-project');
var assert            = require('../utilities/assert');

module.exports.run = function run(options, ui) {
  var rawName = options.args[0];

  assert('Due to an issue with `compileES6` an application name of `test` cannot be used.', rawName !== 'test');

  if (isEmberCliProject()) {
    return Promise.reject(chalk.yellow('Cannot run `ember new` inside of an ' +
      'existing ember-cli project.\n'));
  }

  if (!rawName) {
    return Promise.reject(chalk.yellow('The `ember new` command requires an ' +
      'app-name to be specified. For more details, use `ember help`.\n'));
  }

  var name = stringUtil.dasherize(rawName);
  var namespace = stringUtil.classify(rawName);
  var dir = rawName;

  return mkdir(dir)
    .catch(function(err) {
      if (err.code === 'EEXIST') {
        throw chalk.yellow('Directory \'' + dir + '\' already exists.');
      } else { throw err; }
    })
    .then(function() {
      process.chdir(dir);
      ui.write(chalk.green('Created project directory "' + dir + '".\n'));

      var blueprint = new Blueprint(Blueprint.main, ui);

      return blueprint.install(process.cwd(), {
          name: name,
          modulePrefix: name,
          namespace: namespace
        },
        options.cliOptions['dry-run'],
        options.cliOptions['skip-npm-install']);
    });
};

module.exports.usage = function usage() {
  return 'ember new ' + chalk.yellow('<app-name>');
};
