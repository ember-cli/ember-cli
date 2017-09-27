'use strict';
const symbol = require('../utilities/symbol');

let experiments = {
  CONFIG_CACHING: symbol('config-caching'),
};

Object.freeze(experiments);

module.exports = experiments;
