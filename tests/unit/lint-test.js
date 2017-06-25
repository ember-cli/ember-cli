'use strict';

const glob = require('glob').sync;

let paths = glob('tests/*');

paths = paths.concat([
  'lib',
  'bin',
  'blueprints',
]);

require('mocha-eslint')(paths, {
  timeout: 10000,
  slow: 1000,
});
