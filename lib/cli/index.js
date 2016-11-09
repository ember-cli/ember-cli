'use strict';

// Main entry point
var requireAsHash = require('../utilities/require-as-hash');
var packageConfig = require('../../package.json');
var logger        = require('heimdalljs-logger')('ember-cli:cli/index');
var merge         = require('ember-cli-lodash-subset').merge;
var path          = require('path');

// work around misbehaving libraries, so we can correctly cleanup before
// actually exiting.
require('capture-exit').captureExit();

// ember-cli and user apps have many dependencies, many of which require
// process.addListener('exit', ....) for cleanup, by default this limit for
// such listeners is 10, recently users have been increasing this and not to
// their fault, rather they are including large and more diverse sets of
// node_modules.
//
// https://github.com/babel/ember-cli-babel/issues/76
process.setMaxListeners(1000);

var version      = packageConfig.version;
var name         = packageConfig.name;
var trackingCode = packageConfig.trackingCode;

function loadCommands() {
  var Command = require('../models/command');
  return requireAsHash('../commands/*.js', Command);
}

function loadTasks() {
  var Task = require('../models/task');
  return requireAsHash('../tasks/*.js', Task);
}

function clientId() {
  var ConfigStore = require('configstore');
  var configStore = new ConfigStore('ember-cli');
  var id = configStore.get('client-id');

  if (id) {
    return id;
  } else {
    id = require('node-uuid').v4().toString();
    configStore.set('client-id', id);
    return id;
  }
}

function configureLogger(env) {
  var depth = Number(env['DEBUG_DEPTH']);
  if (depth) {
    var logConfig = require('heimdalljs').configFor('logging');
    logConfig.depth = depth;
  }
}

// Options: Array cliArgs, Stream inputStream, Stream outputStream
module.exports = function(options) {
  var UI = options.UI || require('../ui');
  var Yam = options.Yam || require('yam');
  var CLI = require('./cli');
  var Leek = options.Leek || require('leek');
  var Project = require('../models/project');

  configureLogger(process.env);

  // TODO: one UI (lib/models/project.js also has one for now...)
  var ui = new UI({
    inputStream:  options.inputStream,
    outputStream: options.outputStream,
    errorStream:  options.errorStream || process.stderr,
    errorLog:     options.errorLog || [],
    ci:           process.env.CI || /^(dumb|emacs)$/.test(process.env.TERM),
    writeLevel:   ~process.argv.indexOf('--silent') ? 'ERROR' : undefined
  });

  var config = new Yam('ember-cli', {
    primary: Project.getProjectRoot()
  });

  var leekOptions;

  var disableAnalytics = options.cliArgs &&
    (options.cliArgs.indexOf('--disable-analytics') > -1 ||
    options.cliArgs.indexOf('-v') > -1 ||
    options.cliArgs.indexOf('--version') > -1) ||
    config.get('disableAnalytics');

  var defaultLeekOptions = {
    trackingCode: trackingCode,
    globalName:   name,
    name:         clientId(),
    version:      version,
    silent:       disableAnalytics
  };

  var defaultUpdateCheckerOptions = {
    checkForUpdates: false
  };

  if (config.get('leekOptions')) {
    leekOptions = merge(defaultLeekOptions, config.get('leekOptions'));
  } else {
    leekOptions = defaultLeekOptions;
  }

  logger.info('leek: %o', leekOptions);

  var leek = new Leek(leekOptions);

  var cli = new CLI({
    ui:        ui,
    analytics: leek,
    testing:   options.testing,
    name: options.cli ? options.cli.name : 'ember',
    disableDependencyChecker: options.disableDependencyChecker,
    root: options.cli ? options.cli.root : path.resolve(__dirname, '..', '..'),
    npmPackage: options.cli ? options.cli.npmPackage : 'ember-cli'
  });

  var project = Project.projectOrnullProject(ui, cli);

  var environment = {
    tasks:    loadTasks(),
    cliArgs:  options.cliArgs,
    commands: loadCommands(),
    project:  project,
    settings: merge(defaultUpdateCheckerOptions, config.getAll())
  };

  return cli.run(environment);
};
