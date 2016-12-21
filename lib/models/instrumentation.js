'use strict';

var fs = require('fs-extra');
var chalk = require('chalk');
var experiments = require('../experiments/');

var heimdall;

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

  this.instrumentations = {
    init: options.initInstrumentation,
    build: {
      cookie: null,
      node: null,
      count: 0,
    },
    command: {
      cookie: null,
      node: null,
    },
    teardown: {
      cookie: null,
      node: null,
    },
  };

  if (!options.initInstrumentation && this.isEnabled()) {
    this.start('init');

    this.ui.writeLine(chalk.yellow(
      'No init instrumentation passed to CLI.  Please update your global ember or ' +
      'invoke ember via the local executable within node_modules.  Init ' +
      'instrumentation will still be recorded, but some bootstraping will be ' +
      'omitted.'
    ));
  }
}

module.exports = Instrumentation;

Instrumentation.prototype._buildInstrumentationInfo = function (result, resultAnnotation) {
  var graph = require('heimdalljs-graph');
  var buildTree = graph.loadFromNode(this.instrumentations.build.node);
  var buildSteps = 0;
  var totalTime = 0;

  var node;
  var statName;
  var statValue;
  var nodeItr;
  var statsItr;
  var nextNode;
  var nextStat;

  for (nodeItr = buildTree.dfsIterator();;) {
    nextNode = nodeItr.next();
    if (nextNode.done) { break; }

    node = nextNode.value;
    if (node.label.broccoliNode && !node.label.broccoliCachedNode) {
      ++buildSteps;
    }

    for (statsItr = node.statsIterator();;) {
      nextStat = statsItr.next();
      if (nextStat.done) { break; }

      statName = nextStat.value[0];
      statValue = nextStat.value[1];

      if (statName === 'time.self') {
        totalTime += statValue;
      }
    }
  }

  var vizJson = {
    /* we should calculate the summary more generically */
    summary: {
      build: {
        type: resultAnnotation.type,
        count: this.instrumentations.build.count++,
        outputChangedFiles: result.outputChanges,
      },
      output: result.directory,
      totalTime: totalTime,
      buildSteps: buildSteps,
    },
    buildTree: buildTree,
  };

  if (resultAnnotation.type === 'rebuild') {
    vizJson.summary.build.primaryFile = resultAnnotation.primaryFile;
    vizJson.summary.build.changedFileCount = resultAnnotation.changedFiles.length;
    vizJson.summary.build.changedFiles = resultAnnotation.changedFiles.slice(0, 10);
  }

  return vizJson;
};

Instrumentation.prototype._invokeAddonHook = function (name, instrumentationInfo) {
  if (!experiments.INSTRUMENTATION) { return; }

  if (this.project && this.project.addons.length) {
    this.project.addons.forEach(function (addon) {
      var hook = addon[experiments.INSTRUMENTATION];
      if (typeof hook === 'function') {
        hook.call(addon, name, instrumentationInfo);
      } else if (name === 'build') {
        hook = addon[experiments.BUILD_INSTRUMENTATION];
        if (typeof hook === 'function') {
          hook.call(addon, instrumentationInfo);
        }
      }
    });
  }
};

Instrumentation.prototype._writeInstrumentation = function (name, instrumentationInfo) {
  var filename = 'broccoli-viz.' + name;
  if (name === 'build') {
    filename += '.' + this.instrumentations.build.count;
  }
  filename = filename + '.json';
  fs.writeJsonSync(filename, instrumentationInfo);
};


Instrumentation.prototype.isVizEnabled = vizEnabled;
Instrumentation.prototype.isEnabled = instrumentationEnabled;

Instrumentation.prototype.start = function (name) {
  if (!instrumentationEnabled()) { return; }
  heimdall = heimdall || require('heimdalljs');

  var cookie = heimdall.start({ name: name, emberCLI: true });
  this.instrumentations[name] = {
    cookie: cookie,
    node: heimdall.current,
  };
};

Instrumentation.prototype.stopAndReport = function(name) {
  if (!instrumentationEnabled()) { return; }

  var instrInfoName = '_' + name + 'InstrumentationInfo';
  if (!this[instrInfoName]) {
    throw new Error('uh oh');
  }

  this.instrumentations[name].cookie.stop();
  var args = Array.prototype.slice.call(arguments, 1);
  var instrInfo = this[instrInfoName].apply(this, args);

  this._invokeAddonHook(name, instrInfo);
  this._writeInstrumentation(name, instrInfo);
};


// exported for testing
Instrumentation._enableFSMonitorIfInstrumentationEnabled = _enableFSMonitorIfInstrumentationEnabled;
