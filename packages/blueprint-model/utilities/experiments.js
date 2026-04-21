'use strict';

const { default: chalk } = require('chalk');

/*
  If you're here to remove the VITE experiment flag in favor of it being
  permanently on, you can't do that until addressing
  https://github.com/ember-cli/ember-cli/pull/10781#pullrequestreview-3230644293

  A lot of test coverage would otherwise be lost, because valid tests are being
  run only when the VITE experiment is off.
*/
const availableExperiments = Object.freeze(['EMBROIDER', 'CLASSIC', 'VITE']);

const deprecatedExperiments = Object.freeze([]);
const enabledExperiments = Object.freeze(['VITE']);
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

  if (process.env.EMBER_CLI_CLASSIC && experimentName === 'EMBROIDER') {
    return false;
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
