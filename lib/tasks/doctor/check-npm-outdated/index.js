'use strict';

var Promise = require('../../../ext/promise');
var chalk   = require('chalk');
var npm     = require('npm');

function CheckNPMOutdatedAddon(project) {
  this.project = project;
  this.name = 'check-npm-outdated';
}

CheckNPMOutdatedAddon.prototype.registerDiagnostics = function(type, registry) {
  if (type === 'parent') {
    var npmOptions = {
      logstream: this.project.ui.outputStream,
      color: 'always',
      depth: 0
    };

    registry.add('diagnostic', {
      name: 'check-npm-outdated',
      check: function() {
        return new Promise(function(resolve, reject) {
          this.disableLogger();
          npm.load(npmOptions, function(err) {
            if (err) {
              reject(err);
            } else {
              npm.commands.outdated(function(err, data) {
                if (err) {
                  reject(err);
                } else {
                  if (data && data.length > 0) {
                    this.ui.writeLine(chalk.yellow('Warning: Your project has outdated packages.'));
                    this.ui.write(this.npmTable);
                    resolve(1);
                  }
                  resolve(0);
                }
              }.bind(this));
            }
          }.bind(this));
        }.bind(this), 'npm outdated')
        .finally(this._restoreLogger.bind(this));
      },
      _disableLogger: function() {
        this.oldLog = console.log;
        console.log = function(table) {
          this.npmTable = table;
        }.bind(this);
      },
      _restoreLogger: function() {
        console.log = this.oldLog;
      },
    });
  }
};

module.exports = CheckNPMOutdatedAddon;