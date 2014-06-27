'use strict';

// Main entry point

var UI            = require('../ui');
var Project       = require('../models/project');
var requireAsHash = require('../utilities/require-as-hash');
var Command       = require('../models/command');
var commands      = requireAsHash('../commands/*.js', Command);
var Task          = require('../models/task');
var tasks         = requireAsHash('../tasks/*.js', Task);
var CLI           = require('./cli');
var Leek          = require('leek');
var Yam           = require('yam');
var packageConfig = require('../../package.json');

var version       = packageConfig.version;
var name          = packageConfig.name;
var trackingCode  = packageConfig.trackingCode;

// Options: Array cliArgs, Stream inputStream, Stream outputStream
module.exports = cli;

function cli(options) {
  var ui = new UI({
    inputStream:  options.inputStream,
    outputStream: options.outputStream
  });

  var leek = new Leek({
    trackingCode: trackingCode,
    name:         name,
    version:      version
  });

  var config = new Yam('ember-cli');

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
