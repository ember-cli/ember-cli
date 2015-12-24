'use strict';

var glob = require('glob').sync;

var paths = glob('tests/*').filter(function(path) {
  return !/fixtures/.test(path);
});

// configuration is based on settings found in .jshintrc and .jshintignore
require('mocha-jshint')({
  paths: paths.concat([
    'lib',
    'blueprints',
    'bin'
  ])
});
