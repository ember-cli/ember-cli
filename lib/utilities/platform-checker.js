'use strict';

const semver = require('semver');
let logger = require('heimdalljs-logger')('ember-cli:platform-checker:');
const loadConfig = require('./load-config');

let testedEngines;
if (process.platform === 'win32') {
  testedEngines = loadConfig('appveyor.yml')
    .environment.matrix
    .map(element => element.nodejs_version)
    .join(' || ');
} else {
  testedEngines = loadConfig('.travis.yml')
    .node_js
    .join(' || ');
}

let supportedEngines = loadConfig('package.json').engines.node;

module.exports = PlatformChecker;
function PlatformChecker(version) {
  this.version = version;
  this.isValid = this.checkIsValid();
  this.isTested = this.checkIsTested();
  this.isDeprecated = this.checkIsDeprecated();

  logger.info('%o', {
    version: this.version,
    isValid: this.isValid,
    isTested: this.isTested,
    isDeprecated: this.isDeprecated,
  });
}

PlatformChecker.prototype.checkIsValid = function(range) {
  range = range || supportedEngines;
  return semver.satisfies(this.version, range) || semver.gtr(this.version, supportedEngines);
};

PlatformChecker.prototype.checkIsDeprecated = function(range) {
  range = range || supportedEngines;
  return !this.checkIsValid(range);
};

PlatformChecker.prototype.checkIsTested = function(range) {
  range = range || testedEngines;
  return semver.satisfies(this.version, range);
};
