'use strict';

const CliError = require('../errors/cli');

const availableExperiments = [
  'PACKAGER',
  'MODULE_UNIFICATION',
  'DELAYED_TRANSPILATION',
  'BROCCOLI_2',
  'SYSTEM_TEMP',
];

function isExperimentEnabled(experimentName) {
  if (availableExperiments.indexOf(experimentName) < 0) {
    return false;
  }

  if (process.env.EMBER_CLI_ENABLE_ALL_EXPERIMENTS) {
    return true;
  }

  let experimentEnvironmentVariable = `EMBER_CLI_${experimentName}`;
  if (process.env[experimentEnvironmentVariable]) {
    return true;
  }

  return false;
}

// SYSTEM_TEMP can only be used with BROCCOLI_2
if (isExperimentEnabled('SYSTEM_TEMP') && !isExperimentEnabled('BROCCOLI_2')) {
  throw new CliError('EMBER_CLI_SYSTEM_TEMP only works in combination with EMBER_CLI_BROCCOLI_2');
}

module.exports = { isExperimentEnabled };
