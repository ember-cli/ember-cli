'use strict';

var glob = require('glob').sync;

var paths = glob('tests/*').filter(function(path) {
  return !/fixtures/.test(path);
});

paths = paths.concat([
  'lib',
  'bin',
  'blueprints'
]);

require('mocha-eslint')(paths);
