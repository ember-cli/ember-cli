'use strict';

// eslint-disable-next-line no-unused-vars
const symbol = require('../utilities/symbol');

let experiments = {
  MODULE_UNIFICATION: false,
  DELAYED_TRANSPILATION: false,
};

Object.freeze(experiments);

module.exports = experiments;
