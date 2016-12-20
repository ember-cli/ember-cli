'use strict';

var chalk = require('chalk');


function _enableFSMonitorIfInstrumentationEnabled() {
  var monitor;
  if (instrumentationEnabled()) {
    var FSMonitor = require('heimdalljs-fs-monitor');
    monitor = new FSMonitor();
    monitor.start();
  }
  return monitor;
}

_enableFSMonitorIfInstrumentationEnabled();

var _hasWarnedLegacyViz = false;

function vizEnabled() {
  var isEnabled = process.env.BROCCOLI_VIZ === '1';
  var isLegacyEnabled = !!process.env.BROCCOLI_VIZ && !isEnabled;

  if (isLegacyEnabled && !_hasWarnedLegacyViz) {
    // TODO: this.ui
    console.warn(
      'Please set BROCCOLI_VIZ=1 to enable visual instrumentation, rather than ' +
      '\'' + process.env.BROCCOLI_VIZ + '\''
    );
    _hasWarnedLegacyViz = true;
  }

  return isEnabled || isLegacyEnabled;
}

function instrumentationEnabled() {
  return vizEnabled() || process.env.EMBER_CLI_INSTRUMENTATION === '1';
}


function Instrumentation (options) {
  this.ui = options.ui;

  // project constructor will set up bidirectional link
  this.project = null;

  this.buildInstrumentation = null;
  this.commandInstrumentation = null;
  this.teardownInstrumentation = null;

  this.initInstrumentation = options.initInstrumentation;

  if (!options.initInstrumentation && this.isEnabled()) {
    var heimdall = require('heimdalljs');
    var initInstrumentationCookie = heimdall.start('init');
    this.initInstrumentation = {
      cookie: initInstrumentationCookie,
      node: heimdall.current,
    };

    this.ui.writeLine(chalk.yellow(
      'No init instrumentation passed to CLI.  Please update your global ember or ' +
      'invoke ember via the local executable within node_modules.  Init ' +
      'instrumentation will still be recorded, but some bootstraping will be ' +
      'omitted.'
    ));
  }
}

module.exports = Instrumentation;

Instrumentation.prototype.isVizEnabled = vizEnabled;
Instrumentation.prototype.isEnabled = instrumentationEnabled;

Instrumentation.prototype.report = function (/* step, tree */) {
};

// exported for testing
Instrumentation._enableFSMonitorIfInstrumentationEnabled = _enableFSMonitorIfInstrumentationEnabled;
