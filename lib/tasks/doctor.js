'use strict';
var defaultDoctor = require('./doctor');
var Task          = require('../models/task');
var path          = require('path');
var fs            = require('fs-extra');
var defaults      = require('lodash-node/modern/objects/defaults');
var merge         = require('lodash-node/modern/objects/merge');
var contains      = require('lodash-node/modern/collections/contains');
var chalk         = require('chalk');

module.exports = Task.extend({
  init: function() {
    this.npm = this.npm || require('npm');
  },

  run: function(options) {
    var project         = this.project;
    var isWithinProject = project.isEmberCLIProject();
    var defaultDiagnostics = defaultDoctor;
    var targetDiagnostics;

    if (isWithinProject) {
      targetDiagnostics = this.loadTargetDiagnostics() || {};
    }

    var checks = merge(targetDiagnostics, defaultDiagnostics, defaults);

    return Promise.all(this.beginChecks(checks, options.skip)).then(function() {
      this.ui.writeLine(chalk.green('Clean bill of health.'));
    });

  },

  beginChecks: function(checks, skips) {
    return Object.keys(checks).map(function(key) {
      if (/^check/.test(key) && !contains(skips, key)){
        return checks[key].create().run();
      }
    });
  },

  loadTargetDiagnostics: function() {
    var targetDoctorPath = path.join(this.project.root, 'doctor');
    var hasDoctor = fs.existsSync(targetDoctorPath);

    if (hasDoctor) {
      return require(path.relative('.', targetDoctorPath));
    }
  }
});