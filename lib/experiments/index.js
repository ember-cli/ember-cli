'use strict';
const symbol = require('../utilities/symbol');

let experiments = {
  BUILD_INSTRUMENTATION: symbol('build-instrumentation'),
  INSTRUMENTATION: symbol('instrumentation'),
  ADDON_TREE_CACHING: symbol('addon-tree-caching'),
};

Object.freeze(experiments);

module.exports = experiments;
