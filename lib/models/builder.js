'use strict';
var exit = require('capture-exit');
exit.captureExit();

var fs          = require('fs-extra');
var existsSync  = require('exists-sync');
var path        = require('path');
var Promise     = require('../ext/promise');
var Task        = require('./task');
var SilentError = require('silent-error');
var chalk       = require('chalk');
var attemptNeverIndex = require('../utilities/attempt-never-index');
var findBuildFile = require('../utilities/find-build-file');

var Sync = require('tree-sync');

var signalsTrapped = false;
var buildCount = 0;

function _enableFSMonitorIfVizEnabled() {
  var monitor;
  if (vizEnabled()) {
    var FSMonitor = require('heimdalljs-fs-monitor');
    monitor = new FSMonitor();
    monitor.start();
  }
  return monitor;
}

_enableFSMonitorIfVizEnabled();

function vizEnabled() {
  return !!process.env.BROCCOLI_VIZ;
}

function outputViz(count, result) {
  var nodes = result.graph.__heimdall__.toJSONSubgraph();

  fs.writeJsonSync('broccoli-viz.' + (count) + '.json', {
    /* we should calculate the summary more generically */
    summary: {
      buildCount: count,
      output: result.directory,
      totalTime: result.totalTime,
      totalNodes: nodes.length,
    },
    nodes: nodes,
  });
}

/**
 * Wrapper for the Broccoli [Builder](https://github.com/broccolijs/broccoli/blob/master/lib/builder.js) class.
 *
 * @private
 * @module ember-cli
 * @class Builder
 * @constructor
 * @extends Task
 */
module.exports = Task.extend({

  init: function() {
    this._super.apply(this, arguments);
    this.setupBroccoliBuilder();
    this.trapSignals();
  },

  /**
   * @private
   * @method setupBroccoliBuilder
   */
  setupBroccoliBuilder: function() {
    this.environment = this.environment || 'development';
    process.env.EMBER_ENV = process.env.EMBER_ENV || this.environment;

    var broccoli = require('broccoli-builder');
    var hasBrocfile = existsSync(path.join('.', 'Brocfile.js'));
    var buildFile = findBuildFile('ember-cli-build.js');

    if (hasBrocfile) {
      this.ui.writeDeprecateLine('Brocfile.js has been deprecated in favor of ember-cli-build.js. Please see the transition guide: https://github.com/ember-cli/ember-cli/blob/master/TRANSITION.md#user-content-brocfile-transition.');
      this.tree = require('broccoli-brocfile-loader')();
    } else if (buildFile) {
      this.tree = buildFile({ project: this.project });
    } else {
      throw new Error('No ember-cli-build.js found. Please see the transition guide: https://github.com/ember-cli/ember-cli/blob/master/TRANSITION.md#user-content-brocfile-transition.');
    }

    this.builder = new broccoli.Builder(this.tree);
  },

  /**
   * @private
   * @method trapSignals
   */
  trapSignals: function() {
    if (!signalsTrapped) {
      process.on('SIGINT',  this.onSIGINT.bind(this));
      process.on('SIGTERM', this.onSIGTERM.bind(this));
      process.on('message', this.onMessage.bind(this));
      exit.onExit(this.cleanup.bind(this));

      if (/^win/.test(process.platform)) {
        this.trapWindowsSignals();
      }

      signalsTrapped = true;
    }
  },

  /**
   * @private
   * @method trapWindowsSignals
   */
  trapWindowsSignals: function () {
    // This is required to capture Ctrl + C on Windows
    if (process.stdin && process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.on('data', function (data) {
        if (data.length === 1 && data[0] === 0x03) {
          process.emit('SIGINT');
        }
      });
    }
  },

  /**
    Determine whether the output path is safe to delete. If the outputPath
    appears anywhere in the parents of the project root, the build would
    delete the project directory. In this case return `false`, otherwise
    return `true`.

    @private
    @method canDeleteOutputPath
    @param {String} outputPath
    @return {Boolean}
  */
  canDeleteOutputPath: function(outputPath) {
    var rootPathParents = [this.project.root];
    var dir = path.dirname(this.project.root);
    rootPathParents.push(dir);
    while (dir !== path.dirname(dir)) {
      dir = path.dirname(dir);
      rootPathParents.push(dir);
    }
    return rootPathParents.indexOf(outputPath) === -1;
  },

  /**
   * @private
   * @method copyToOutputPath
   * @param {String} inputPath
   */
  copyToOutputPath: function(inputPath) {
    var outputPath = this.outputPath;

    fs.mkdirsSync(outputPath);

    if (!this.canDeleteOutputPath(outputPath)) {
      throw new SilentError('Using a build destination path of `' + outputPath + '` is not supported.');
    }

    var sync = this._sync;
    if (sync === undefined) {
      this._sync = sync = new Sync(inputPath, path.resolve(this.outputPath));
    }

    sync.sync();
  },

  /**
   * @private
   * @method processBuildResult
   * @param results
   * @return {Promise}
   */
  processBuildResult: function(results) {
    var self = this;

    return Promise.resolve()
      .then(function() {
        return self.copyToOutputPath(results.directory);
      })
      .then(function() {
        return results;
      });
  },

  /**
   * @private
   * @method processAddonBuildSteps
   * @param buildStep
   * @param results
   * @return {Promise}
   */
  processAddonBuildSteps: function(buildStep, results) {
    var addonPromises = [];
    if (this.project && this.project.addons.length) {
      addonPromises = this.project.addons.map(function(addon) {
        if (addon[buildStep]) {
          return addon[buildStep](results);
        }
      }).filter(Boolean);
    }

    return Promise.all(addonPromises).then(function() {
      return results;
    });
  },

  /**
   * @private
   * @method build
   * @return {Promise}
   */
  build: function() {
    var self = this;
    var args = [];
    for (var i = 0, l = arguments.length; i < l; i++) {
      args.push(arguments[i]);
    }

    attemptNeverIndex('tmp');

    return this.processAddonBuildSteps('preBuild')
      .then(function() {
        return self.builder.build.apply(self.builder, args);
      })
      .then(function(result) {

        if (vizEnabled()) {
          outputViz(buildCount++, result);
        }
        return result;
      })
      .then(this.processAddonBuildSteps.bind(this, 'postBuild'))
      .then(this.processBuildResult.bind(this))
      .then(this.processAddonBuildSteps.bind(this, 'outputReady'))
      .then(this.checkForPostBuildEnvironmentIssues.bind(this))
      .catch(function(error) {
        this.processAddonBuildSteps('buildError', error);
        throw error;
      }.bind(this));
  },

  /**
   * Delegates to the `cleanup` method of the wrapped Broccoli builder.
   *
   * @private
   * @method cleanup
   * @return {Promise}
   */
  cleanup: function() {
    var ui = this.project.ui;
    ui.startProgress('cleaning up');
    ui.writeLine('cleaning up...');

    return this.builder.cleanup().finally(function() {
      ui.stopProgress();
    }).catch(function(err) {
      ui.writeLine(chalk.red('Cleanup error.'));
      ui.writeError(err);
    });
  },

  /**
   * Checks for issues in the environment that can't easily be detected until
   * after a build and issues any necessary deprecation warnings.
   *
   * - check for old (pre 0.1.4) versions of heimdalljs
   *
   * @private
   * @method checkForPostBuildEnvironmentIssues
   */
  checkForPostBuildEnvironmentIssues: function(value) {
    // 0.1.3 and prior used a global heimdall instance to share sessions
    // newer versions keep the session itself on process
    this.project.ui.writeDeprecateLine('Heimdalljs < 0.1.4 found.  Please remove old versions of heimdalljs and reinstall (you can find them with `npm ls heimdalljs` as long as you have nothing `npm link`d).  Performance instrumentation data will be incomplete until then.', !process._heimdall);

    return value;
  },

  /**
   * Handles the `SIGINT` signal.
   *
   * Calls {{#crossLink "Builder/cleanupAndExit:method"}}{{/crossLink}} by default.
   *
   * @private
   * @method onSIGINT
   */
  onSIGINT: function() {
    process.exit(1);
  },

  /**
   * Handles the `SIGTERM` signal.
   *
   * Calls {{#crossLink "Builder/cleanupAndExit:method"}}{{/crossLink}} by default.
   *
   * @private
   * @method onSIGTERM
   */
  onSIGTERM: function() {
    process.exit(1);
  },

  /**
   * Handles the `message` event on the `process`.
   *
   * Calls {{#crossLink "Builder/cleanupAndExit:method"}}{{/crossLink}} by default
   * if the `kill` property on the `message` is set.
   *
   * @private
   * @method onMessage
   */
  onMessage: function(message) {
    if (message.kill) {
      process.exit(1);
    }
  }
});

module.exports._enableFSMonitorIfVizEnabled = _enableFSMonitorIfVizEnabled;
