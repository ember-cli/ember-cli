'use strict';

var chalk         = require('chalk');
var Promise       = require('../ext/promise');
var Task          = require('../models/task');
var isGitRepo     = require('../utilities/git-repo');
var lookupVersion = require('../utilities/node-module-version');

module.exports = Task.extend({
  init: function() {
    this.semver = this.semver || require('semver');
  },

  run: function() {
    var merge = require('lodash-node/modern/objects/merge');
    var pkg = this.project.pkg;
    var deps = merge({}, pkg.dependencies, pkg.devDependencies);

    return this.validateDependencies(deps);
  },

  validateDependencies: function(dependencies) {
    var resolvedPackages = Object.keys(dependencies).map(function(name) {
      return this.resolvePackage(name, dependencies[name]);
    }, this);

    var isUnsatisfied = function(pkg) {
      return !!pkg.needUpdate;
    };

    return Promise.filter(resolvedPackages, isUnsatisfied)
      .then(function(unsatisfiedPackages) {
        if (unsatisfiedPackages.length === 0) {
          return Promise.resolve();
        } else {
          this.reportUnsatisfiedPackages(unsatisfiedPackages);
          return Promise.reject();
        }
      }.bind(this));
  },

  resolvePackage: function(name, version) {
    return lookupVersion(this.project.root, name)
      .then(function(versionInstalled) {
        return {
          name: name,
          versionSpecified: version,
          versionInstalled: versionInstalled,
          needUpdate: this.updateRequired(name, version, versionInstalled)
        };
      }.bind(this));
  },

  updateRequired: function(name, version, versionInstalled) {
    if (!versionInstalled) {
      return true;
    }

    if (isGitRepo(version)) {
      var parts = version.split('#');
      if (parts.length === 2) {
        version = this.semver.valid(parts[1]);
        if (!version) {
          return false;
        }
      }
    }

    if (!this.semver.validRange(version)) {
      return false;
    }

    return !this.semver.satisfies(versionInstalled, version);
  },

  reportUnsatisfiedPackages: function(packages) {
    var ui = this.ui;

    ui.writeLine(chalk.red('The project has unsatisfied NPM dependencies. You may need to run `npm install`.'));
    ui.writeLine('');

    packages.map(function(pkg) {
      ui.writeLine('Package: ' + chalk.cyan(pkg.name));
      ui.writeLine(chalk.grey('  * Specified: ') + pkg.versionSpecified);
      ui.writeLine(chalk.grey('  * Installed: ') + (pkg.versionInstalled || '(not installed)'));
      ui.writeLine('');
    });
  }
});
