'use strict';

/* eslint-disable node/no-unpublished-require */
const which = require('which');

module.exports = which.sync('yarn', { nothrow: true });
