'use strict';

const glob = require('glob').sync;

let paths = glob('tests/*').filter(function(path) {
  return !(/fixtures/).test(path);
});

paths = paths.concat([
  'lib',
  'bin',
  'blueprints',
]);

require('mocha-eslint')(paths, {
  timeout: 10000,
  slow: 1000,
});
