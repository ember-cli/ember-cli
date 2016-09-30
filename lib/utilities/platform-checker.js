'use strict';

var semver = require('semver');
var logger = require('heimdalljs-logger')('ember-cli:platform-checker:');

var findup = require('find-up');
var fs = require('fs');
var yaml = require('js-yaml');

function getConfigFile(path) {
  var configPath = findup.sync(path, { cwd: __dirname });
  return fs.readFileSync(configPath, 'utf8');
}

var testedEngines;
if (process.platform === 'win32') {
  testedEngines = yaml
    .safeLoad(getConfigFile('appveyor.yml'))
    .environment.matrix
    .map(function(element) {
      return element.nodejs_version;
    })
    .join(' || ');
} else {
  testedEngines = yaml
    .safeLoad(getConfigFile('.travis.yml'))
    .node_js
    .join(' || ');
}

var supportedEngines = JSON.parse(getConfigFile('package.json')).engines.node;

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
    isDeprecated: this.isDeprecated
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
