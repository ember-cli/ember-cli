'use strict';

const chalk = require('chalk');
const spawn = require('child_process').spawn;
const defaults = require('ember-cli-lodash-subset').defaults;
const killCliProcess = require('./kill-cli-process');
const logOnFailure = require('./log-on-failure');
let debug = require('heimdalljs-logger')('run-command');
const { captureExit, onExit } = require('capture-exit');

// when running the full test suite, `process.exit` has already been captured
// however, when running specific files (e.g. `mocha some/path/to/file.js`)
// exit may not be captured before `runCommand` attempts to call `onExit`
captureExit();

let RUNS = [];
module.exports = function run(/* command, args, options */) {
  let command = arguments[0];
  let args = Array.prototype.slice.call(arguments, 1);
  let options = {};

  if (typeof args[args.length - 1] === 'object') {
    options = args.pop();
  }

  options = defaults(options, {
    // If true, pass through stdout/stderr.
    // If false, only pass through stdout/stderr if the current test fails.
    verbose: false,

    onOutput(string) {
      options.log(string);
    },

    onError(string) {
      options.log(chalk.red(string));
    },

    log(string) {
      debug.debug(string);
      if (options.verbose) {
        console.log(string);
      } else {
        logOnFailure(string);
      }
    },
  });

  let child;
  const promise = new Promise(function (resolve, reject) {
    options.log(`      Running: ${command} ${args.join(' ')} in: ${process.cwd()}`);

    let opts = {};
    args = [`--unhandled-rejections=strict`, `${command}`].concat(args);
    command = 'node';
    if (process.platform === 'win32') {
      opts.windowsVerbatimArguments = true;
      opts.stdio = [null, null, null, 'ipc'];
    }
    if (options.env) {
      opts.env = defaults(options.env, process.env);
    }

    debug.info('runCommand: %s, args: %o', command, args);
    child = spawn(command, args, opts);
    RUNS.push(child);
    // ensure we tear down the child process on exit;
    onExit(() => killCliProcess(child));

    let result = {
      output: [],
      errors: [],
      code: null,
    };

    child.stdout.on('data', function (data) {
      let string = data.toString();

      options.onOutput(string, child);

      result.output.push(string);
    });

    child.stderr.on('data', function (data) {
      let string = data.toString();

      options.onError(string, child);

      result.errors.push(string);
    });

    child.on('close', function (code, signal) {
      result.code = code;
      result.signal = signal;

      if (code === 0) {
        resolve(result);
      } else {
        reject(result);
      }
    });
  });

  promise.kill = function () {
    killCliProcess(child);
  };

  return promise;
};

module.exports.killAll = function () {
  RUNS.forEach((run) => {
    try {
      killCliProcess(run);
    } catch (e) {
      console.error(e);
      // during teardown, issues can arise, but teardown must complete it's operation
    }
  });
  RUNS.length = 0;
};
