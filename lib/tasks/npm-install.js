'use strict';

// Runs `npm install` in cwd

var Promise = require('../ext/promise');
var chalk   = require('chalk');
var Task    = require('../models/task');
var glob    = require('glob');

module.exports = Task.extend({

  init: function() {
    this.npm = this.npm || require('npm');
  },
  // Options: Boolean verbose
  run: function(options) {
    console.log('OMG')
    this.ui.startProgress(chalk.green('Installing packages for tooling via npm'), chalk.green('.'));

    var npmOptions = {
      loglevel: 'warning',
      //logstream: this.ui.outputStream,
      color: 'always',
      'save-dev': !!options['save-dev'],
      'save-exact': !!options['save-exact']
    };
    var packages = options.packages || [];

    // npm otherwise is otherwise noisy, already submitted PR for npm to fix
    // misplaced console.log
    //
    this.disableLogger();

    var load = Promise.denodeify(this.npm.load);

    console.log(npmOptions);

    return load(npmOptions)
      .then(function() {
        console.log("didLoad");
        // if install is denodeified outside load.then(),
        // it throws "Call npm.load(config, cb) before using this command."
        var install = Promise.denodeify(this.npm.commands.install);

        console.log('cwd', process.cwd());
        console.log(glob.sync('*'))
        console.log(glob.sync('node_modules/*'))
        console.log(packages);
         console.log('before promise')
        return new Promise(function(resolve){
          console.log('inside promise')
          console.log('packages', packages)
          console.log(this.npm.commands.install.toString());
          return this.npm.commands.install(packages, function(err, installed) {
            console.log('install complete', err, installed)
            if (err) {
              reject(err);
            } else {
              resolve(installed);
            }
          });
        }.bind(this));
        console.log('after calling npm.install');
      }.bind(this))
      .catch(function(a){
        console.log('did FAIL NPM install');
        throw a;
      })
      .then(function(a) {
        console.log('did complete NPM install');
          return a;
      })
      .finally(this.finally.bind(this))
      .then(this.announceCompletion.bind(this));
  },

  announceCompletion: function() {
    this.ui.writeLine(chalk.green('Installed packages for tooling via npm.'));
  },

  finally: function() {
    this.ui.stopProgress();
    this.restoreLogger();
  },

  disableLogger: function() {
    //this.oldLog = console.log;
    //console.log = function() {};
  },

  restoreLogger: function() {
    //console.log = this.oldLog; // Hack, see above
  }
});
