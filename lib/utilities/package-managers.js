'use strict';

const CommandGenerator = require('./command-generator');

/**
 * The `bower` command helper.
 *
 * @private
 * @method bower
 * @param {String} subcommand The subcommand to be passed into bower.
 * @param {String} [...arguments] Arguments to be passed into the bower subcommand.
 * @param {Object} [options={}] The options passed into child_process.spawnSync.
 *   (https://nodejs.org/api/child_process.html#child_process_child_process_spawnsync_command_args_options)
 */
let bower = new CommandGenerator('bower');

/**
 * The `npm` command helper.
 *
 * @private
 * @method npm
 * @param {String} subcommand The subcommand to be passed into npm.
 * @param {String} [...arguments] Arguments to be passed into the npm subcommand.
 * @param {Object} [options={}] The options passed into child_process.spawnSync.
 *   (https://nodejs.org/api/child_process.html#child_process_child_process_spawnsync_command_args_options)
 */
let npm = new CommandGenerator('npm');

/**
 * The `yarn` command helper.
 *
 * @private
 * @method yarn
 * @param {String} subcommand The subcommand to be passed into yarn.
 * @param {String} [...arguments] Arguments to be passed into the yarn subcommand.
 * @param {Object} [options={}] The options passed into child_process.spawnSync.
 *   (https://nodejs.org/api/child_process.html#child_process_child_process_spawnsync_command_args_options)
 */
let yarn = new CommandGenerator('yarn');

module.exports = Object.freeze({
  commands: {
    bower,
    npm,
    yarn,
  },
  lookups: {
    manifest: {
      bower: 'bower.json',
      npm: 'package.json',
      yarn: 'package.json',
    },
    path: {
      bower: 'bower_components',
      npm: 'node_modules',
      yarn: 'node_modules',
    },
    upgrade: {
      bower: 'update',
      npm: 'install',
      yarn: 'upgrade',
    },
  },
});
