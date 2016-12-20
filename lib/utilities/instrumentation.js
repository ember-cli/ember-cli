'use strict';

var hasWarnedLegacyViz = false;
// Whether or not to write instrumentation information to disk.  Implies
// `instrumentationEnabled`.

function vizEnabled() {
  var isEnabled = process.env.BROCCOLI_VIZ === '1';
  var isLegacyEnabled = !!process.env.BROCCOLI_VIZ && !isEnabled;

  if (isLegacyEnabled && !hasWarnedLegacyViz) {
    console.warn(
      'Please set BROCCOLI_VIZ=1 to enable visual instrumentation, rather than ' +
      '\'' + process.env.BROCCOLI_VIZ + '\''
    );
    hasWarnedLegacyViz = true;
  }

  return isEnabled || isLegacyEnabled;
}

function instrumentationEnabled() {
  return vizEnabled() || process.env.EMBER_CLI_INSTRUMENTATION === '1';
}

module.exports = {
  vizEnabled: vizEnabled,
  instrumentationEnabled: instrumentationEnabled,
};
