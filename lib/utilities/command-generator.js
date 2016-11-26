var execSync = require('child_process').execSync;
var merge = require('ember-cli-lodash-subset').merge;

/**
 * A simple tool to make behavior consistent between the package manager commands.
 *
 * @class CommandGenerator
 * @constructor
 * @param {Path} program The path to the command.
 * @param {Object} options The options for the command invocation.
 * @return {Function} A command helper.
 */
function CommandGenerator(program, options) {
  this.program = program;
  this.options = merge({
    networkCommands: []
  }, options);
}

CommandGenerator.prototype = {

  /**
   * The `command` method is responsible for generating the invocation array.
   *
   * @method command
   * @return {Array} An array of the individual segments of the command invocation.
   */
  command: function() {
    var invocation = [];

    invocation = invocation.concat(this.ci.apply(this, arguments));
    invocation.push(this.program);
    invocation = invocation.concat(Array.prototype.slice.call(arguments));

    return invocation;
  },

  /**
   * The `ci` method is able to modify the invocation for ci.
   *
   * @method ci
   * @param {String} subcommand The subcommand.
   * @return {Array} An array of the individual segments of the command invocation.
   */
  ci: function(subcommand) {
    var invocation = [];

    if (subcommand && ~this.options.networkCommands.indexOf(subcommand)) {
      if (process.env.TRAVIS === 'true') {
        invocation.push('travis_retry');
      } else if (process.env.APPVEYOR === 'True') {
        invocation.push('appveyor-retry');
      }
    }

    return invocation;
  },

  /**
   * The `invoke` method is responsible for building the final executable command.
   *
   * @method command
   * @param {String} [...arguments] Arguments to be passed into the command.
   * @param {Object} [options={}] The options passed into child_process.execSync.
   *   (https://nodejs.org/api/child_process.html#child_process_child_process_execsync_command_options)
   */
  invoke: function() {
    var args = Array.prototype.slice.call(arguments);
    var options = {};

    if (typeof args[args.length - 1] === 'object') {
      options = args.pop();
    }

    options = merge({
      stdio: ['ignore', 'ignore', 'ignore']
    }, options);

    var invocation = this.command.apply(this, args);

    this._invoke(invocation.join(' '), options);
  },

  _invoke: function(command, options) {
    execSync(command, options);
  }
};

module.exports = CommandGenerator;
