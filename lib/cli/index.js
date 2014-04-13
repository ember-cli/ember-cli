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

require('../ext/promise');

// Options: Array cliArgs, Stream inputStream, Stream outputStream
module.exports = cli;

function cli(options) {
  var ui = new UI({
    inputStream:  options.inputStream,
    outputStream: options.outputStream
  });

  var environment = {
    tasks: tasks,
    cliArgs: options.cliArgs,
    commands: commands,
    isWithinProject: Project.isWithinProject()
  };

  return new CLI(ui).run(environment);
}
