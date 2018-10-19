'use strict';

const which = require('which');

function hasGlobalYarn() {
  return which.sync('yarn', { nothrow: true });
}

module.exports = hasGlobalYarn;
