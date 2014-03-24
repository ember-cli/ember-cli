'use strict';

var npm = require('npm');

module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-release');

  grunt.config({
    release: {
      options: {
        files: ['package.json', 'blueprint/package.json'],
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

  grunt.registerTask('release:updateBlueprint', function() {

  });

  grunt.registerTask('ember:release', ['release:updateBlueprint', 'release']);
  for(var level in ['patch', 'major', 'minor']) {
    grunt.registerTask('ember:release:' + level, ['test', 'release:updateBlueprint', 'release:' + level]);
  }

};
