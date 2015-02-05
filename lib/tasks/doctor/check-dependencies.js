'use strict';
var Task    = require('../../models/task');
var Promise = require('../../ext/promise');
var DependencyChecker = require('ember-cli-dependency-checker');

module.exports = Task.extend({
  run: function() {
    return new Promise(function(resolve){
      new DependencyChecker(this.project);
      resolve();
    });
  }
});