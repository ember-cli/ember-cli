'use strict';

module.exports = function escapeRegExp(str) {
  return String(str).replace(/(\W)/g, '\\$1');
};
