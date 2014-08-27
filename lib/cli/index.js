'use strict';

// Main entry point
var Project       = require('../models/project');
var requireAsHash = require('../utilities/require-as-hash');
var Command       = require('../models/command');
var commands      = requireAsHash('../commands/*.js', Command);
var Task          = require('../models/task');
var tasks         = requireAsHash('../tasks/*.js', Task);
var CLI           = require('./cli');
var Yam           = require('yam');
var packageConfig = require('../../package.json');

var version      = packageConfig.version;
var name         = packageConfig.name;
var trackingCode = packageConfig.trackingCode;

// Options: Array cliArgs, Stream inputStream, Stream outputStream
module.exports = cli;

function cli(options) {
  var UI = options.UI || require('../ui');
  var Leek = options.Leek || require('leek');

  var ui = new UI({
    inputStream:  options.inputStream,
    outputStream: options.outputStream
  });

  var config = new Yam('ember-cli');

  var leek = new Leek({
    trackingCode: trackingCode,
    globalName:   name,
    version:      version,
    silent:       config.get('disableAnalytics')
  });

  var project = Project.closest(process.cwd())
    .catch(function(reason) {
      if (reason instanceof Project.NotFoundError) {
        return Project.NULL_PROJECT;
      } else {
        throw reason;
      }
    });

  var environment = {
    tasks:    tasks,
    cliArgs:  options.cliArgs,
    commands: commands,
    project:  project,
    settings: config.getAll()
  };

  return new CLI({
    ui:        ui,
    analytics: leek,
    testing:   options.testing
  }).run(environment);
}
