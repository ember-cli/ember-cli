'use strict';

var path = require('path');
var adapt = require('../adapters');
var chalk = require('chalk');

module.exports.types = {
  'port': Number,
  'live-reload-port': Number,
  'host': String,
  'autotest': Boolean, // TODO
  'environment': [
    'development',
    'production'
  ],
  'app': path
};

module.exports.shorthands = {
  p: '--port',
  lrp: '--live-reload-port',
  env: '--environment'
};

var DEFAULT_PORT = process.env.PORT || 4200;
var DEFAULT_HOST = '0.0.0.0';
var LIVE_RELOAD_PORT = 35729;

module.exports.run = function run(options) {
  var adapter = adapt.to('broccoli');

  options.port = options.port || DEFAULT_PORT;
  options.host = options.host || DEFAULT_HOST;
  options.liveReloadPort = options.liveReloadPort || (parseInt(options.port, 10) - 8000) + LIVE_RELOAD_PORT;

  return adapter.server(options);
};

module.exports.getEnv = function(options) {
  return options.environment || options.env;
};

module.exports.usage = function usage() {
  return 'ember server\n' +
  '      --autotest   ' + chalk.green('[default: false]')+'\n' +
  '      --port       ' + chalk.green('[default: ' + DEFAULT_PORT + ']') + '\n' +
  '      --host       ' + chalk.green('[default: ' + DEFAULT_HOST + ']') + '\n' +
  '      --subscribe  ' + chalk.green('[default:release, optional: (beta|canary)]')+'\n' +
  '                     ' + chalk.green('#') + ' on "start" of an app, it will prompt the user if the channel they\n' +
  '                     ' + chalk.green('#') + ' subscribe to has an update.\n' +
  '                     ' + chalk.green('#') + ' if an update occured. they are asked ' + chalk.green('[yes, no]') + ' to try the update (using bower)\n' +
  '                     ' + chalk.green('#') + '   (what about other libs? ember-data or components or..)\n' +
  '      --env        ' + chalk.green('[default: development] #')+' allow previewing the various build envs.\n' +
  '      --app        ' + chalk.green('[default: .]')+'\n';
};
