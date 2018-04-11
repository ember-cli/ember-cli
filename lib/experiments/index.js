'use strict';

// eslint-disable-next-line no-unused-vars
const symbol = require('../utilities/symbol');

let experiments = {
  MODULE_UNIFICATION: symbol('module-unification'),
  DELAYED_TRANSPILATION: symbol('delayed-transpilation'),
};

Object.freeze(experiments);

module.exports = experiments;
