'use strict';

var semver = require('semver');

module.exports = function(version) {

  return semver.satisfies(version, '>=0.12.0');
};
