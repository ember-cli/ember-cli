'use strict';

// Main entry point

var UI            = require('../ui');
var Project       = require('../models/project');
var requireAsHash = require('../utilities/require-as-hash');
var Command       = require('../command');
var commands      = requireAsHash('../commands/*.js', Command);
var Task          = require('../task');
var tasks         = requireAsHash('../tasks/*.js', Task);
var CLI           = require('./cli');
var Leek          = require('leek');
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

  var environment = {
    tasks: tasks,
    cliArgs: options.cliArgs,
    commands: commands,
    isWithinProject: Project.isWithinProject() // TODO: this should go away once we are injecting project
  };

  return new CLI(ui, leek).run(environment);
}
