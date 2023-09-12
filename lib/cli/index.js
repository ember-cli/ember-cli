'use strict';

const willInterruptProcess = require('../utilities/will-interrupt-process');
const instrumentation = require('../utilities/instrumentation');
const getConfig = require('../utilities/get-config');
const ciInfo = require('ci-info');

let initInstrumentation;
if (instrumentation.instrumentationEnabled()) {
  const heimdall = require('heimdalljs');
  let initInstrumentationToken = heimdall.start('init');
  initInstrumentation = {
    token: initInstrumentationToken,
    node: heimdall.current,
  };
}

// Main entry point
const requireAsHash = require('../utilities/require-as-hash');
const { merge } = require('ember-cli-lodash-subset');
const path = require('path');
const heimdall = require('heimdalljs');

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

function configureLogger(env) {
  let depth = Number(env['DEBUG_DEPTH']);
  if (depth) {
    let logConfig = require('heimdalljs').configFor('logging');
    logConfig.depth = depth;
  }
}

// Options: Array cliArgs, Stream inputStream, Stream outputStream, EventEmitter process
module.exports = async function (options) {
  // `process` should be captured before we require any libraries which
  // may use `process.exit` work arounds for async cleanup.
  willInterruptProcess.capture(options.process || process);

  try {
    let UI = options.UI || require('console-ui');
    const CLI = require('./cli');
    const Project = require('../models/project');
    let config = getConfig(options.Yam);

    configureLogger(process.env);

    // TODO: one UI (lib/models/project.js also has one for now...)
    let ui = new UI({
      inputStream: options.inputStream,
      outputStream: options.outputStream,
      errorStream: options.errorStream || process.stderr,
      errorLog: options.errorLog || [],
      ci: ciInfo.isCI || /^(dumb|emacs)$/.test(process.env.TERM),
      writeLevel: process.argv.indexOf('--silent') !== -1 ? 'ERROR' : undefined,
    });

    let cli = new CLI({
      ui,
      testing: options.testing,
      name: options.cli ? options.cli.name : 'ember',
      disableDependencyChecker: options.disableDependencyChecker,
      root: options.cli ? options.cli.root : path.resolve(__dirname, '..', '..'),
      npmPackage: options.cli ? options.cli.npmPackage : 'ember-cli',
      initInstrumentation,
    });

    let project = Project.projectOrnullProject(ui, cli);

    let defaultUpdateCheckerOptions = {
      checkForUpdates: false,
    };

    let environment = {
      tasks: loadTasks(),
      cliArgs: options.cliArgs,
      commands: loadCommands(),
      project,
      settings: merge(defaultUpdateCheckerOptions, config.getAll()),
    };

    return await cli.run(environment);
  } finally {
    willInterruptProcess.release();
  }
};
