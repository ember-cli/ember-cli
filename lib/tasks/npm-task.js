'use strict';

// Runs `npm install` in cwd

var Promise = require('../ext/promise');
var chalk   = require('chalk');
var Task    = require('../models/task');

module.exports = Task.extend({
  // The command to run: can be 'install' or 'uninstall'
  command: '',
  // Message to send to ui.startProgress
  startProgressMessage: '',
  // Message to send to ui.writeLine on completion
  completionMessage: '',

  init: function() {
    this.npm = this.npm || require('npm');
  },
  // Options: Boolean verbose
  run: function(options) {
    var npmOptions = {
      loglevel: options.verbose ? 'verbose' : 'error',
      logstream: this.ui.outputStream,
      color: 'always',
      'save-dev': !!options['save-dev'],
      'save-exact': !!options['save-exact']
    };
    var packages = options.packages || [];

    if (options.preferLocalCache) {
      // In some bright future npm may have an `--offline` flag
      // (https://github.com/npm/npm/issues/2568 may tell you when). Until then
      // we can achieve a similar result by setting 'cache-min' to a high value.
      // Any module in the cache that is younger than 'cache-min' will *never*
      // be fetched remotely. The npm cache is documented at
      // https://docs.npmjs.com/misc/config#cache-min
      npmOptions['cache-min'] = 7776000; // 90 days in seconds
      this.startProgressMessage += ' (using local cache where possible)';
      this.completionMessage += ' (using local cache where possible)';
    }

    this.ui.startProgress(chalk.green(this.startProgressMessage), chalk.green('.'));

    // npm otherwise is otherwise noisy, already submitted PR for npm to fix
    // misplaced console.log
    this.disableLogger();

    var load = Promise.denodeify(this.npm.load);

    return load(npmOptions)
      .then(function() {
        // if install is denodeified outside load.then(),
        // it throws "Call npm.load(config, cb) before using this command."
        var install = Promise.denodeify(this.npm.commands[this.command]);

        return install(packages);
      }.bind(this))
      .finally(this.finally.bind(this))
      .then(this.announceCompletion.bind(this));
  },

  announceCompletion: function() {
    this.ui.writeLine(chalk.green(this.completionMessage));
  },

  finally: function() {
    this.ui.stopProgress();
    this.restoreLogger();
  },

  disableLogger: function() {
    this.oldLog = console.log;
    console.log = function() {};
  },

  restoreLogger: function() {
    console.log = this.oldLog; // Hack, see above
  }
});
