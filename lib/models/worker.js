'use strict';

const workerpool = require('workerpool');
const gzipStats = require('./gzip-stats');

// create worker and register public functions
workerpool.worker({
  gzipStats,
});
