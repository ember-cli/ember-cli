'use strict';

// Main entry point

var RSVP         = require('rsvp');
var UI           = require('../ui');
var parseCLIArgs = require('./parse-cli-args');
var loadCommands = require('./load-commands');
var loadTasks    = require('./load-tasks');
var findProject  = require('./find-project');

require('../ext/promise');

// Options: Array cliArgs, Stream inputStream, Stream outputStream
module.exports = cli;
function cli(options) {
  var ui = new UI({
    inputStream: options.inputStream,
    outputStream: options.outputStream
  });

  var environment = {
    ui: ui,
    commands: loadCommands(),
    tasks: loadTasks(),
    cliArgs: options.cliArgs,
    project: findProject()
  };

  return RSVP.hash(environment)
    .then(function(environment) {
      // Parse argv, returns null and writes message to ui if it fails
      var parsingOutput = parseCLIArgs(environment);

      // If the command was found, run it!
      if (parsingOutput) {
        return parsingOutput.command.run(
            environment,
            parsingOutput.commandOptions
          );
      }
    })
    .catch(function(error) {
      // The error being falsy signifies that it has been handled
      if (error) { ui.write((error.stack || error) + '\n'); }
    });
}
