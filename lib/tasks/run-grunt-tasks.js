'use strict';

var Promise          = require('../ext/promise');
var Task             = require('../models/task');
var grunt            = require('grunt');

module.exports = Task.extend({
  run: function(options) {
    process.env.EMBER_ENV = options.environment || 'development';

    return new Promise(function(resolve) {
      grunt.tasks(options.tasks, {}, function() {
        resolve();
      });
    });
  }
});
