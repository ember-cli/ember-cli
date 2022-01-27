'use strict';

const CommandGenerator = require('./command-generator');
const logger = require('heimdalljs-logger')('ember-cli:npm-task');

const BOWER = 'bower';
const NPM = 'npm';
const YARN = 'yarn';
const PNPM = 'pnpm';

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

/**
 * The `pnpm` command helper.
 *
 * @private
 * @method pnpm
 * @param {String} subcommand The subcommand to be passed into pnpm.
 * @param {String} [...arguments] Arguments to be passed into the pnpm subcommand.
 * @param {Object} [options={}] The options passed into child_process.spawnSync.
 *   (https://nodejs.org/api/child_process.html#child_process_child_process_spawnsync_command_args_options)
 */
let pnpm = new CommandGenerator(PNPM);

// The definition list of translation terms.
let lookups = {
  manifest: {
    [BOWER]: 'bower.json',
    [NPM]: 'package.json',
    [YARN]: 'package.json',
    [PNPM]: 'package.json',
  },
  path: {
    [BOWER]: 'bower_components',
    [NPM]: 'node_modules',
    [YARN]: 'node_modules',
    [PNPM]: 'node_modules',
  },
  upgrade: {
    [BOWER]: 'update',
    [NPM]: 'install',
    [YARN]: 'upgrade',
    [PNPM]: 'update',
  },
};
let commands = {
  bower,
  npm,
  yarn,
  pnpm,
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

function toNpmArgs(command, options) {
  let args = [command];

  if (options.save) {
    args.push('--save');
  }

  if (options['save-dev']) {
    args.push('--save-dev');
  }

  if (options['save-exact']) {
    args.push('--save-exact');
  }

  if ('optional' in options && !options.optional) {
    args.push('--no-optional');
  }

  if (options.verbose) {
    args.push('--loglevel', 'verbose');
  } else {
    args.push('--loglevel', 'error');
  }

  if (options.packages) {
    args = args.concat(options.packages);
  }

  return args;
}

function toYarnArgs(command, options) {
  let args = [];

  if (command === 'install') {
    if (options.save) {
      args.push('add');
    } else if (options['save-dev']) {
      args.push('add', '--dev');
    } else if (options.packages) {
      throw new Error(`npm command "${command} ${options.packages.join(' ')}" can not be translated to Yarn command`);
    } else {
      args.push('install');
    }

    if (options['save-exact']) {
      args.push('--exact');
    }

    if ('optional' in options && !options.optional) {
      args.push('--ignore-optional');
    }
  } else if (command === 'uninstall') {
    args.push('remove');
  } else {
    throw new Error(`npm command "${command}" can not be translated to Yarn command`);
  }

  if (options.verbose) {
    args.push('--verbose');
  }

  if (options.packages) {
    args = args.concat(options.packages);
  }

  // Yarn v2 defaults to non-interactive
  // with an optional -i flag

  if (semver.lt(this.packageManager.version, '2.0.0')) {
    args.push('--non-interactive');
  }

  return args;
}

function toPNPMArgs(command, options) {
  let args = [];

  if (command === 'install') {
    if (options.save) {
      args.push('add');
    } else if (options['save-dev']) {
      args.push('add', '--save-dev');
    } else if (options.packages) {
      throw new Error(`npm command "${command} ${options.packages.join(' ')}" can not be translated to pnpm command`);
    } else {
      args.push('install');
    }

    if (options['save-exact']) {
      args.push('--save-exact');
    }
  } else if (command === 'uninstall') {
    args.push('remove');
  } else {
    throw new Error(`npm command "${command}" can not be translated to pnpm command`);
  }

  if (options.packages) {
    args = args.concat(options.packages);
  }

  return args;
}

async function runCommand(packageManager, command, options, execOptions = { preferLocal: false }) {
  let args;

  if (packageManager === YARN) {
    args = toYarnArgs(command, options);
  } else if (packageManager === PNPM) {
    args = toPNPMArgs(command, options);
  } else if (packageManager === NPM) {
    args = toNpmArgs(command, options);
  } else {
    throw new Error(`Package manager '${packageManager}' is not supported`);
  }

  logger.info('%s: %j', packageManager, args);
  await commands[packageManager].invoke(args, execOptions);

  if (packageManager === NPM) {
    // as of 2018-10-09 npm 5 and 6 _break_ the hierarchy of `node_modules`
    // after a `npm install foo` (deletes files/folders other than
    // what was directly installed) in some circumstances, see:
    //
    // * https://github.com/npm/npm/issues/16853
    // * https://github.com/npm/npm/issues/17379
    //
    // this ensures that we run a full `npm install` **after** any `npm
    // install foo` runs to ensure that we have a fully functional
    // node_modules hierarchy
    let npmVersion = this.packageManager.version;
    if (npmVersion && semver.lt(npmVersion, '5.7.1')) {
      await commands.npm.invoke(['install'], execOptions);
    }
  }
}

module.exports = Object.freeze({
  BOWER,
  NPM,
  YARN,
  PNPM,
  commands,
  lookups,
  translate,
  runCommand,
});
