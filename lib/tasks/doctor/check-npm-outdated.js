'use strict';
var Task    = require('../../models/task');
var Promise = require('../../ext/promise');
var debug   = require('debug')('ember-cli/tasks/doctor/check-npm-outdated');
var chalk   = require('chalk');

module.exports = Task.extend({
  init: function() {
    this.npm = this.npm || require('npm');
  },
  run: function(options) {
    options = options || {};
    var packages = options.packages || [];

    var npmOptions = {
      logstream: this.ui.outputStream,
      color: 'always',
      depth: options.depth || 0
    };

    if (options.packages && typeof options.packages === 'string') {
      packages = [options.packages];
    }

    return new Promise(function(resolve, reject) {
      this.disableLogger();
      this.npm.load(npmOptions, function(err) {
        if (err) {
          reject(err);
        } else {
          this.npm.commands.outdated(packages, function(err, data) {
            if (err) {
              reject(err);
            } else {
              if (data && data.length > 0) {
                this.ui.writeLine(chalk.bgMagenta('NPM Outdated Check:'));
                this.ui.writeLine(chalk.yellow('Your project has outdated packages.'));
                this.ui.write(this.npmTable);
              }
              resolve(data);
            }
          }.bind(this));
        }
      }.bind(this));
    }.bind(this), 'npm outdated')
    .finally(this.finally.bind(this));
  },

  finally: function() {
    this.restoreLogger();
  },

  restoreLogger: function() {
    console.log = this.oldLog;
  },

  disableLogger: function() {
    this.oldLog = console.log;
    console.log = function(table) {
      this.npmTable = table;
    }.bind(this);
  },
});