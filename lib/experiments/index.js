'use strict';
const symbol = require('../utilities/symbol');

let experiments = {
  BUILD_INSTRUMENTATION: symbol('build-instrumentation'),
  INSTRUMENTATION: symbol('instrumentation'),
  ADDON_TREE_CACHING: symbol('addon-tree-caching'),
  NPM_BLUEPRINTS: symbol('npm-blueprints'),
};

Object.freeze(experiments);

module.exports = experiments;
