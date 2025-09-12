'use strict';

const execa = require('../../lib/utilities/execa');

/**
 * A simple tool to make behavior and API consistent between commands
 * the user wraps in this.
 *
 * Usage:
 *
 * ```
 * let npm = new CommandGenerator('npm');
 * npm.invoke('install', 'ember-source', '--save-dev');
 * ```
 *
 * @private
 * @class CommandGenerator
 * @constructor
 * @param {Path} program The path to the command.
 * @returns {Function} A command helper.
 */
module.exports = class CommandGenerator {
  constructor(program) {
    this.program = program;
  }

  /**
   * The `invoke` method is responsible for building the final executable command.
   *
   * @private
   * @function command
   * @param {String} [...arguments] Arguments to be passed into the command.
   * @param {Object} [options={}] The options passed into child_process.spawnSync.
   *   (https://nodejs.org/api/child_process.html#child_process_child_process_spawnsync_command_args_options)
   */
  invoke() {
    let args = Array.prototype.slice.call(arguments);
    let options = {};

    if (typeof args[args.length - 1] === 'object') {
      options = args.pop();
    }

    return this._invoke(args, options);
  }

  _invoke(args, options) {
    return execa.sync(this.program, args, options);
  }
};
