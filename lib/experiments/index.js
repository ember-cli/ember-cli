'use strict';

const CliError = require('../errors/cli');

// eslint-disable-next-line no-unused
function isExperimentEnabled(experimentName) {
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

let experiments = {
  PACKAGER: isExperimentEnabled('PACKAGER'),
  MODULE_UNIFICATION: isExperimentEnabled('MODULE_UNIFICATION'),
  DELAYED_TRANSPILATION: isExperimentEnabled('DELAYED_TRANSPILATION'),
  BROCCOLI_2: isExperimentEnabled('BROCCOLI_2'),
  SYSTEM_TEMP: isExperimentEnabled('BROCCOLI_2') && isExperimentEnabled('SYSTEM_TEMP'),
};

Object.freeze(experiments);

module.exports = experiments;
