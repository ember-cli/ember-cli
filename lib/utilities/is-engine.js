'use strict';

module.exports = function isEngine(keywords) {
  return !!(Array.isArray(keywords) && keywords.indexOf('ember-engine') >= 0);
};
