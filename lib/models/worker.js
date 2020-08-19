'use strict';

const workerpool = require('workerpool');
const gzipStats = require('./gzipStats');

// create worker and register public functions
workerpool.worker({
  gzipStats,
});
