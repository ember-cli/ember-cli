'use strict';

var execa = require('execa');

/**
 * A simple tool to make behavior and API consistent between commands
 * the user wraps in this.
 *
 * Usage:
 *
 * ```
 * var bower = new CommandGenerator(require.resolve('bower/bin/bower'));
 * bower.invoke('install', 'ember');
 * ```
 *
 * @class CommandGenerator
 * @constructor
 * @param {Path} program The path to the command.
 * @return {Function} A command helper.
 */
module.exports = CommandGenerator;
function CommandGenerator(program) {
  this.program = program;
}

CommandGenerator.prototype = {

  /**
   * The `invoke` method is responsible for building the final executable command.
   *
   * @method command
   * @param {String} [...arguments] Arguments to be passed into the command.
   * @param {Object} [options={}] The options passed into child_process.spawnSync.
   *   (https://nodejs.org/api/child_process.html#child_process_child_process_spawnsync_command_args_options)
   */
  invoke: function() {
    var args = Array.prototype.slice.call(arguments);
    var options = {};

    if (typeof args[args.length - 1] === 'object') {
      options = args.pop();
    }

    this._invoke(args, options);
  },

  _invoke: function(args, options) {
    execa.sync(this.program, args, options);
  }
};
