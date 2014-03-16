'use strict';

var grunt = require('grunt');
var path = require('path');
var Promise = require('rsvp').Promise;

var envTasks = {
  'development': 'build:debug',
  'production': 'dist'
};

module.exports = function build(options) {
  grunt.cli.tasks = [envTasks[options.environment]];
  grunt.cli.options = {
    base: options.appRoot,
    cliRoot: options.cliRoot,
    appRoot: options.appRoot,
    outputPath: options.outputPath || 'dist/'
  };

  return new Promise(function(resolve){
    grunt.cli({
      name: 'build',
      gruntfile: path.join(options.cliRoot, 'Gruntfile.js')
    }, resolve);
  });
};
