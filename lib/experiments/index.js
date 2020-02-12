'use strict';

const chalk = require('chalk');
const availableExperiments = Object.freeze(['PACKAGER']);

const deprecatedExperiments = Object.freeze(['BROCCOLI_WATCHER']);
const enabledExperiments = Object.freeze([]);
const deprecatedExperimentsDeprecationsIssued = [];

function isExperimentEnabled(experimentName) {
  if (!availableExperiments.includes(experimentName)) {
    return false;
  }

  if (process.env.EMBER_CLI_ENABLE_ALL_EXPERIMENTS && deprecatedExperiments.includes(experimentName)) {
    return false;
  }

  if (process.env.EMBER_CLI_ENABLE_ALL_EXPERIMENTS) {
    return true;
  }

  let experimentEnvironmentVariable = `EMBER_CLI_${experimentName}`;
  let experimentValue = process.env[experimentEnvironmentVariable];

  if (deprecatedExperiments.includes(experimentName)) {
    let deprecationPreviouslyIssued = deprecatedExperimentsDeprecationsIssued.includes(experimentName);
    let isSpecifiedByUser = experimentValue !== undefined;

    if (!deprecationPreviouslyIssued && isSpecifiedByUser) {
      console.warn(
        chalk.yellow(`The ${experimentName} experiment in ember-cli has been deprecated and will be removed.`)
      );
      deprecatedExperimentsDeprecationsIssued.push(experimentName);
    }
  }

  if (enabledExperiments.includes(experimentName)) {
    return experimentValue !== 'false';
  } else {
    return experimentValue !== undefined && experimentValue !== 'false';
  }
}

module.exports = {
  isExperimentEnabled,

  // exported for testing purposes
  _deprecatedExperimentsDeprecationsIssued: deprecatedExperimentsDeprecationsIssued,
};
