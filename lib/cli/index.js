'use strict';

// Main entry point

var UI            = require('../ui');
var findProject   = require('./find-project');
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
    commands: commands,
    tasks: tasks,
    cliArgs: options.cliArgs,
    project: findProject()
  };

  return new CLI(ui).run(environment);
}
