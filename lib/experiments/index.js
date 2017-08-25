'use strict';
const symbol = require('../utilities/symbol');
const getCallerFile = require('get-caller-file');
const deprecate = require('../utilities/deprecate');

let experiments = {
  MODULE_UNIFICATION: symbol('module-unification'),
  TREE_SHAKING: symbol('tree-shaking'),
  get INSTRUMENTATION() {
    deprecate(`\`experiments.INSTRUMENTATION\` is deprecated now that the feature has landed, use \`instrumentation\` method on your addon instead. Required from: \n${getCallerFile()}`, true);

    return 'instrumentation';
  },
};

Object.freeze(experiments);

module.exports = experiments;
