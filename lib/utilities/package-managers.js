'use strict';

const CommandGenerator = require('./command-generator');

const BOWER = 'bower';
const NPM = 'npm';
const YARN = 'yarn';

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
let bower = new CommandGenerator(BOWER);

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
let npm = new CommandGenerator(NPM);

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
let yarn = new CommandGenerator(YARN);

// The definition list of translation terms.
let lookups = {
  manifest: {
    [BOWER]: 'bower.json',
    [NPM]: 'package.json',
    [YARN]: 'package.json',
  },
  path: {
    [BOWER]: 'bower_components',
    [NPM]: 'node_modules',
    [YARN]: 'node_modules',
  },
  upgrade: {
    [BOWER]: 'update',
    [NPM]: 'install',
    [YARN]: 'upgrade',
  },
};

/**
 * The `translate` command is used to turn a consistent argument into
 * appropriate values based upon the context in which it is used. It's
 * a convenience helper to avoid littering lookups throughout the code.
 *
 * @private
 * @method translate
 * @param {String} type Either 'bower', 'npm', or 'yarn'.
 * @param {String} lookup Either 'manifest', 'path', or 'upgrade'.
 */
function translate(type, lookup) {
  return lookups[lookup][type];
}

module.exports = Object.freeze({
  BOWER,
  NPM,
  YARN,
  commands: {
    bower,
    npm,
    yarn,
  },
  lookups,
  translate,
});
