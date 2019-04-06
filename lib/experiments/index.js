'use strict';

const availableExperiments = Object.freeze(['PACKAGER', 'MODULE_UNIFICATION', 'DELAYED_TRANSPILATION', 'SYSTEM_TEMP']);

const enabledExperiments = Object.freeze(['SYSTEM_TEMP']);

function isExperimentEnabled(experimentName) {
  if (!availableExperiments.includes(experimentName)) {
    return false;
  }

  if (process.env.EMBER_CLI_ENABLE_ALL_EXPERIMENTS) {
    return true;
  }

  let experimentEnvironmentVariable = `EMBER_CLI_${experimentName}`;
  let experimentValue = process.env[experimentEnvironmentVariable];
  if (enabledExperiments.includes(experimentName)) {
    return experimentValue !== 'false';
  } else {
    return experimentValue !== undefined && experimentValue !== 'false';
  }
}

module.exports = { isExperimentEnabled };
