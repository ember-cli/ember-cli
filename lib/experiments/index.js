'use strict';
const symbol = require('../utilities/symbol');

let experiments = {
  BUILD_INSTRUMENTATION: symbol('build-instrumentation'),
  INSTRUMENTATION: symbol('instrumentation'),
};

Object.freeze(experiments);

module.exports = experiments;
