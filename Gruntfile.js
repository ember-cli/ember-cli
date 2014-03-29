'use strict';

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

  [
    'patch',
    'major',
    'minor'
  ].forEach(function(level) {
    grunt.registerTask('ember:release:' + level, [
      'test',
      'release:' + level
    ]);
  });
};
