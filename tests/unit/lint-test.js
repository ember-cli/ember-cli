'use strict';

const glob = require('glob').sync;

let paths = glob('tests/*');

paths = paths.concat([
  'lib',
  'blueprints',
]);

require('mocha-eslint')(paths, {
  timeout: 5000,
  slow: 1000,
});
