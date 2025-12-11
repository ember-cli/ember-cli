'use strict';

const { worker } = require('workerpool');
const gzipStats = require('./gzipStats');

// create worker and register public functions
worker({
  gzipStats,
});
