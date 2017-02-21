'use strict';

const instrumentation = require('../utilities/instrumentation');

let initInstrumentation;
if (instrumentation.instrumentationEnabled()) {
  const heimdall = require('heimdalljs');
  let initInstrumentationToken = heimdall.start('init');
  initInstrumentation = {
    token: initInstrumentationToken,
    node: heimdall.current,
  };
}

// work around misbehaving libraries, so we can correctly cleanup before
// actually exiting.
require('capture-exit').captureExit();

// Main entry point
const requireAsHash = require('../utilities/require-as-hash');
const packageConfig = require('../../package.json');
let logger = require('heimdalljs-logger')('ember-cli:cli/index');
const merge = require('ember-cli-lodash-subset').merge;
const path = require('path');
const heimdall = require('heimdalljs');

// ember-cli and user apps have many dependencies, many of which require
// process.addListener('exit', ....) for cleanup, by default this limit for
// such listeners is 10, recently users have been increasing this and not to
// their fault, rather they are including large and more diverse sets of
// node_modules.
//
// https://github.com/babel/ember-cli-babel/issues/76
process.setMaxListeners(1000);

let version = packageConfig.version;
let name = packageConfig.name;
let trackingCode = packageConfig.trackingCode;

function loadCommands() {
  let token = heimdall.start('load-commands');
  const Command = require('../models/command');
  let hash = requireAsHash('../commands/*.js', Command);
  token.stop();
  return hash;
}

function loadTasks() {
  let token = heimdall.start('load-tasks');
  const Task = require('../models/task');
  let hash = requireAsHash('../tasks/*.js', Task);
  token.stop();
  return hash;
}

function clientId() {
  const ConfigStore = require('configstore');
  let configStore = new ConfigStore('ember-cli');
  let id = configStore.get('client-id');

  if (id) {
    return id;
  } else {
    id = require('uuid').v4().toString();
    configStore.set('client-id', id);
    return id;
  }
}

function configureLogger(env) {
  let depth = Number(env['DEBUG_DEPTH']);
  if (depth) {
    let logConfig = require('heimdalljs').configFor('logging');
    logConfig.depth = depth;
  }
}

// Options: Array cliArgs, Stream inputStream, Stream outputStream
module.exports = function(options) {
  let UI = options.UI || require('console-ui');
  let Yam = options.Yam || require('yam');
  const CLI = require('./cli');
  let Leek = options.Leek || require('leek');
  const Project = require('../models/project');

  configureLogger(process.env);

  // TODO: one UI (lib/models/project.js also has one for now...)
  let ui = new UI({
    inputStream: options.inputStream,
    outputStream: options.outputStream,
    errorStream: options.errorStream || process.stderr,
    errorLog: options.errorLog || [],
    ci: process.env.CI || (/^(dumb|emacs)$/).test(process.env.TERM),
    writeLevel: (process.argv.indexOf('--silent') !== -1) ? 'ERROR' : undefined,
  });

  let config = new Yam('ember-cli', {
    primary: Project.getProjectRoot(),
  });

  let leekOptions;

  let disableAnalytics = (options.cliArgs &&
    (options.cliArgs.indexOf('--disable-analytics') > -1 ||
    options.cliArgs.indexOf('-v') > -1 ||
    options.cliArgs.indexOf('--version') > -1)) ||
    config.get('disableAnalytics');

  let defaultLeekOptions = {
    trackingCode,
    globalName: name,
    name: clientId(),
    version,
    silent: disableAnalytics,
  };

  let defaultUpdateCheckerOptions = {
    checkForUpdates: false,
  };

  if (config.get('leekOptions')) {
    leekOptions = merge(defaultLeekOptions, config.get('leekOptions'));
  } else {
    leekOptions = defaultLeekOptions;
  }

  logger.info('leek: %o', leekOptions);

  let leek = new Leek(leekOptions);

  let cli = new CLI({
    ui,
    analytics: leek,
    testing: options.testing,
    name: options.cli ? options.cli.name : 'ember',
    disableDependencyChecker: options.disableDependencyChecker,
    root: options.cli ? options.cli.root : path.resolve(__dirname, '..', '..'),
    npmPackage: options.cli ? options.cli.npmPackage : 'ember-cli',
    initInstrumentation,
  });

  let project = Project.projectOrnullProject(ui, cli);

  let environment = {
    tasks: loadTasks(),
    cliArgs: options.cliArgs,
    commands: loadCommands(),
    project,
    settings: merge(defaultUpdateCheckerOptions, config.getAll()),
  };

  return cli.run(environment);
};
