'use strict';

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

let experiments = {
  PACKAGER: isExperimentEnabled('PACKAGER'),
  MODULE_UNIFICATION: isExperimentEnabled('MODULE_UNIFICATION'),
  DELAYED_TRANSPILATION: isExperimentEnabled('DELAYED_TRANSPILATION'),
};

Object.freeze(experiments);

module.exports = experiments;
