'use strict';

// eslint-disable-next-line n/no-unpublished-require
const which = require('which');

module.exports = which.sync('yarn', { nothrow: true });
