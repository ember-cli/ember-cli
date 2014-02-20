var grunt = require('grunt'),
    path = require('path'),
    Promise = require('rsvp').Promise;

var envTasks = {
  'development': 'server',
  'production': 'server:dist'
};

module.exports = function(options, done) {
  var environment = options.environment || 'development';

  grunt.cli.tasks = [
    envTasks[environment]
  ];

  grunt.cli.options = {
    base: options.appRoot,
    appRoot: options.appRoot,
    cliRoot: options.cliRoot,
    port: options.port,
    outputPath: options.outputPath || 'dist/'
  };

  return new Promise(function(resolve) {
    grunt.cli({
      name: 'build',
      gruntfile: path.join(options.cliRoot, 'Gruntfile.js')
    }, resolve);
  });
};
