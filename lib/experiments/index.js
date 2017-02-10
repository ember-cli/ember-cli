'use strict';
const symbol = require('../utilities/symbol');
const getCallerFile = require('get-caller-file');
const deprecate = require('../utilities/deprecate');

let experiments = {
  BUILD_INSTRUMENTATION: symbol('build-instrumentation'),
  NPM_BLUEPRINTS: symbol('npm-blueprints'),
  BROWSER_TARGETS: symbol('browser-targets'),
  get INSTRUMENTATION() {
    deprecate(`\`experiments.INSTRUMENTATION\` is deprecated now that the feature has landed, use \`instrumentation\` method on your addon instead. Required from: \n${getCallerFile()}`, true);

    return 'instrumentation';
  },
};


Object.freeze(experiments);

module.exports = experiments;
