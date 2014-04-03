'use strict';

var npm = require('npm');

module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-release');

  grunt.initConfig({
    release: {
      options: {
        tagName: 'v<%= version %>',
        commitMessage: 'bump v<%= version %> :tada:',
        tagMessage: 'v<%= version %>'
      }
    }
  });

  grunt.registerTask('test', function() {
    var done = this.async();

    npm.load({
      logLevel: 'error'
    }, function(error) {
      if(error) {
        grunt.fail.fatal('Could not load npm');
        return;
      }

      npm.runScript('test', function(error) {
        if(error) {
          grunt.fail.fatal('tests failed');
          return;
        }

        grunt.log.write('tests passed, wtg');
        done();
      });
    });
  });

  grunt.registerTask('ember:release', ['test', 'release']);

  [
    'patch',
    'major',
    'minor'
  ].forEach(function(level) {
    grunt.registerTask('ember:release:' + level, ['test', 'release:' + level]);
  });
};
