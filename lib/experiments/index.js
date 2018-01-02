'use strict';
const symbol = require('../utilities/symbol');

let experiments = {
  MODULE_UNIFICATION: symbol('module-unification'),
};

Object.freeze(experiments);

module.exports = experiments;
