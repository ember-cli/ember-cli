'use strict';

var ANALYTICS_WHITELISTED_COMMANDS = [
  'addon',
  'asset-sizes',
  'build',
  'destroy',
  'generate',
  'help',
  'init',
  'install',
  'install-addon',
  'install-bower',
  'install-npm',
  'new',
  'serve',
  'test',
  'uninstall-npm',
  'unknown',
  'version'
];

module.exports = {
  // note: we actuall do not want to expose commands that are
  // whitelisted, it's done only for testing purposes
  // (see tests/unit/analytics-test.js)
  ANALYTICS_WHITELISTED_COMMANDS: ANALYTICS_WHITELISTED_COMMANDS,
  isWhitelisted: function(name) {
    if (!name) { return false; }
    return ANALYTICS_WHITELISTED_COMMANDS.indexOf(name) !== -1;
  }
};
