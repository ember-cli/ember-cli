'use strict';

var glob = require('glob').sync;

var paths = glob('tests/*').filter(function(path) {
  return !/fixtures/.test(path);
});

paths = paths.concat([
  'lib',
  'bin'
]);

require('mocha-jscs')(paths);

paths = paths.concat([
  'blueprints'
]);

// configuration is based on settings found in .jshintrc and .jshintignore
require('mocha-jshint')({
  paths: paths
});
