'use strict';

var processVersions = require('../../../utilities/get-versions').versions;
var semver          = require('semver');
var Table           = require('cli-table');
var Promise         = require('../../../ext/promise');
var os              = require('os');

function CheckVersionsAddon(project) {
  this.project = project;
  this.name = 'check-versions';
}

CheckVersionsAddon.prototype.registerDiagnostics = function(type, registry) {
  if (type === 'parent') {
    var pkg = this.project.pkg;
    var ui = this.project.ui;
    
    registry.add('diagnostic', {
      name: 'check-versions',
      check: function() {
        var mismatches = [];
        var userVersions = processVersions();
        if (pkg.os.indexOf(os.platform()) < 0) {
          mismatches.push(['os', os.platform(), pkg.os.join(',')]);
        }

        Object.keys(userVersions).forEach(function(name) {
          switch (name) {
            case 'npm':
              if (!semver.satisfies(userVersions[name], pkg.dependencies.npm)) {
                mismatches.push([
                  name,
                  userVersions[name],
                  pkg.dependencies.npm
                ]);
              }
              break;
            case 'node':
              if (!semver.satisfies(userVersions[name], pkg.engines.node)) {
                mismatches.push([
                  name,
                  userVersions[name],
                  pkg.engines.node
                ]);
              }
              break;
          }
        });

        return new Promise(function(resolve) {
          if (mismatches.length) {
            var table = new Table({
              head: ['Name', 'Yours', 'Expected']
            });

            mismatches.forEach(function(mismatch) {
              table.push(mismatch);
            });

            ui.write('Warning: Mismatched system level dependencies.');
            ui.write(table.toString());
            resolve(1);
          }
          resolve(0);
        }.bind(this));
      }
    });
  }
};

module.exports = CheckVersionsAddon;