'use strict';

var defaultDoctor = require('./doctor');
var Task          = require('../models/task');
var path          = require('path');
var fs            = require('fs-extra');
var defaults      = require('lodash-node/modern/objects/defaults');
var merge         = require('lodash-node/modern/objects/merge');
var contains      = require('lodash-node/modern/collections/contains');
var chalk         = require('chalk');
var Promise       = require('../ext/promise');

module.exports = Task.extend({
  init: function() {
    this.npm = this.npm || require('npm');
  },

  run: function(options) {
    var project            = this.project;
    var isWithinProject    = project.isEmberCLIProject();
    var defaultDiagnostics = defaultDoctor;
    var targetDiagnostics  = {};

    // Check to see if the project has it's own diagnostics
    if (isWithinProject) {
      targetDiagnostics = this.loadTargetDiagnostics() || {};
    }

    var checks = merge(targetDiagnostics, defaultDiagnostics, defaults);

    return Promise.all(this.beginChecks(checks, options.skip)).then(function() {
      this.ui.writeLine(chalk.green('Clean bill of health.'));
    });

  },

  /**
   * Filters out skipped checkes and then creates
   * and runs the checks.
   * @param  {Object} checks Object containing all of the checks
   * @param  {Array} skips  Array of items to skip
   * @return {Array}        Returns an array of Promises of the checks
   */
  beginChecks: function(checks, skips) {
    return Object.keys(checks).filter(function(key) {
      var shortName = key.replace('check-', '');
      return /^check/.test(key) && !contains(skips, shortName);
    }).map(function(key) {
      return checks[key].create().run();
    });
  },

  /**
   * If the project has it's own diagnostic files include them
   * @return {Object} An object containing all checks for the project
   */
  loadTargetDiagnostics: function() {
    var targetDoctorPath = path.join(this.project.root, 'doctor');
    var hasDoctor = fs.existsSync(targetDoctorPath);

    if (hasDoctor) {
      return require(path.relative('.', targetDoctorPath));
    }
  }
});