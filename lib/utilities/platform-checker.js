'use strict';

const semver = require('semver');
const logger = require('heimdalljs-logger')('ember-cli:platform-checker:');
const loadConfig = require('./load-config');

const ci = loadConfig('.github/workflows/ci.yml');
const nodeVersions = new Set();

for (let jobName in ci.jobs) {
  let job = ci.jobs[jobName];

  job.steps.forEach(step => {
    let isSetupNode = step.uses === 'actions/setup-node@v1';
    if (isSetupNode && step.with['node-version'].includes('${{') === false) {
      nodeVersions.add(step.with['node-version']);
    }
  });

  if (job.strategy && job.strategy.matrix && job.strategy.matrix['node-version']) {
    job.strategy.matrix['node-version'].forEach(version => nodeVersions.add(version));
  }
}

const testedEngines = Array.from(nodeVersions).join(' || ');

let supportedEngines = loadConfig('package.json').engines.node;

module.exports = class PlatformChecker {
  constructor(version) {
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

  checkIsValid(range) {
    range = range || supportedEngines;
    return semver.satisfies(this.version, range) || semver.gtr(this.version, range);
  }

  checkIsDeprecated(range) {
    return !this.checkIsValid(range);
  }

  checkIsTested(range) {
    range = range || testedEngines;
    return semver.satisfies(this.version, range);
  }
};
