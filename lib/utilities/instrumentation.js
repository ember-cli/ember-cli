'use strict';

const getConfig = require('./get-config');

function vizEnabled() {
  return process.env.BROCCOLI_VIZ === '1';
}

function isInstrumentationConfigEnabled(configOverride) {
  let config = getConfig(configOverride);
  return !!config.get('enableInstrumentation');
}

function instrumentationEnabled(config) {
  return vizEnabled() || process.env.EMBER_CLI_INSTRUMENTATION === '1' || isInstrumentationConfigEnabled(config);
}

module.exports = {
  vizEnabled,
  instrumentationEnabled,
};
