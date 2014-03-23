'use strict';

var Promise = require('rsvp').Promise;
var path = require('path');
var adapt = require('../adapters');
var chalk = require('chalk');

module.exports.types = {
  output: path
};

module.exports.shorthands = {
  o: ['output']
};

module.exports.run = function run(options) {
  var adapter = adapt.to('broccoli');

  return new Promise(function(resolve) {
    resolve(adapter.build({
      environment: options.env || 'development',
      outputPath: options.output,
      appRoot: options.appRoot,
      cliRoot: options.cliRoot
    }));
  });
};

module.exports.getEnv = function(options) {
  return options.argv.remain[1];
};

module.exports.usage = function usage() {
  return 'ember build ' + chalk.yellow('<env-name>') + ' ' +
                          chalk.green('[default: development] [optional: target path]');
};
