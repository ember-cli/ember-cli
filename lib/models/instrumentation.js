'use strict';

var fs = require('fs-extra');
var chalk = require('chalk');
var experiments = require('../experiments/');
var tree = require('heimdalljs-tree');

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
    shutdown: {
      cookie: null,
      node: null,
    },
  };

  this._heimdall = null;

  if (!options.initInstrumentation && this.isEnabled()) {
    this.instrumentations.init = {
      cookie: null,
      node: null,
    };
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

Instrumentation.prototype._buildSummary = function (result, resultAnnotation) {
  var graph = require('heimdalljs-tree');
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

  var summary = {
    build: {
      type: resultAnnotation.type,
      count: this.instrumentations.build.count++,
      outputChangedFiles: result.outputChanges,
    },
    output: result.directory,
    totalTime: totalTime,
    buildSteps: buildSteps,
  };

  if (resultAnnotation.type === 'rebuild') {
    summary.build.primaryFile = resultAnnotation.primaryFile;
    summary.build.changedFileCount = resultAnnotation.changedFiles.length;
    summary.build.changedFiles = resultAnnotation.changedFiles.slice(0, 10);
  }

  return summary;
};

Instrumentation.prototype._initSummary = function () {
};

Instrumentation.prototype._instrumentationFor = function (name) {
  var instr = this.instrumentations[name];
  if (!instr) {
    throw new Error('No such instrumentation "' + name + '"');
  }
  return instr;
};

Instrumentation.prototype._instrumentationTreeFor = function(name) {
  return tree.loadFromNode(this.instrumentations[name].node);
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
  if (!vizEnabled()) { return; }

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

  var instr = this._instrumentationFor(name);
  this._heimdall = this._heimdall || require('heimdalljs');

  var cookie = this._heimdall.start({ name: name, emberCLI: true });
  instr.cookie = cookie;
  instr.node = this._heimdall.current;
};

Instrumentation.prototype.stopAndReport = function(name) {
  if (!instrumentationEnabled()) { return; }

  var instr = this._instrumentationFor(name);
  if (!instr.cookie) {
    throw new Error('Cannot stop instrumentation "' + name + '".  It has not started.');
  }
  instr.cookie.stop();

  var instrSummaryName = '_' + name + 'Summary';
  if (!this[instrSummaryName]) {
    throw new Error('No summary found for "' + name + '"');
  }

  var args = Array.prototype.slice.call(arguments, 1);
  var instrInfo = {
    summary: this[instrSummaryName].apply(this, args),
    tree: this._instrumentationTreeFor(name),
  };

  this._invokeAddonHook(name, instrInfo);
  this._writeInstrumentation(name, instrInfo);
};


// exported for testing
Instrumentation._enableFSMonitorIfInstrumentationEnabled = _enableFSMonitorIfInstrumentationEnabled;
