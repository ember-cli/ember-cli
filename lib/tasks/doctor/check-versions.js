'use strict';

var Task            = require('../../models/task');
var processVersions = require('../../utilities/get-versions').versions;
var semver          = require('semver');
var Table           = require('cli-table');
var Promise         = require('../../ext/promise');
var os              = require('os');

module.exports = Task.extend({
  init: function() {
    this.npm = this.npm || require('npm');
    this.os = require('os');
  },
  run: function(options) {
    options = options || {};
    var mismatches = [];
    var pkg = this.project.pkg;
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

        this.ui.write(table.toString());
      }
      resolve();
    }.bind(this));
  }
});