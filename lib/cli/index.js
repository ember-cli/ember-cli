'use strict';

// Main entry point

var RSVP          = require('rsvp');
var UI            = require('../ui');
var parseCLIArgs  = require('./parse-cli-args');
var findProject   = require('./find-project');
var chalk         = require('chalk');
var requireAsHash = require('../utilities/require-as-hash');
var Command       = require('../command');
var commands      = requireAsHash('../commands/*.js', Command);
var Task          = require('../task');
var tasks         = requireAsHash('../tasks/*.js', Task);

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
    commands: commands,
    tasks: tasks,
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
    .catch(logError);
}

function logError(error) {
  if (error) {
    if (error instanceof Error) {
      console.log(chalk.red(error.message));
      console.log(error.stack.toString().replace(/,/g, '\n'));
    } else {
      console.log(chalk.red(error));
    }
  }
}