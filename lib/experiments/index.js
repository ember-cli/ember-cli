'use strict';
const symbol = require('../utilities/symbol');

let experiments = {
  BUILD_INSTRUMENTATION: symbol('build-instrumentation'),
  INSTRUMENTATION: 'instrumentation',
  NPM_BLUEPRINTS: symbol('npm-blueprints'),
  BROWSER_TARGETS: symbol('browser-targets'),
};

Object.freeze(experiments);

module.exports = experiments;
