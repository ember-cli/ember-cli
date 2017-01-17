'use strict';
const exit = require('capture-exit');
exit.captureExit();

const fs = require('fs-extra');
const existsSync = require('exists-sync');
const path = require('path');
const Promise = require('rsvp').Promise;
const CoreObject = require('core-object');
const SilentError = require('silent-error');
const chalk = require('chalk');
const attemptNeverIndex = require('../utilities/attempt-never-index');
const findBuildFile = require('../utilities/find-build-file');
const _resetTreeCache = require('./addon')._resetTreeCache;

const Sync = require('tree-sync');
const heimdall = require('heimdalljs');

/**
 * Wrapper for the Broccoli [Builder](https://github.com/broccolijs/broccoli/blob/master/lib/builder.js) class.
 *
 * @private
 * @module ember-cli
 * @class Builder
 * @constructor
 * @extends Task
 */
class Builder extends CoreObject {

  constructor(options) {
    super(options);

    this.setupBroccoliBuilder();
    this.trapSignals();
    this._instantiationStack = (new Error()).stack.replace(/[^\n]*\n/, '');
  }

  /**
   * @private
   * @method setupBroccoliBuilder
   */
  setupBroccoliBuilder() {
    this.environment = this.environment || 'development';
    process.env.EMBER_ENV = process.env.EMBER_ENV || this.environment;

    const broccoli = require('broccoli-builder');
    let hasBrocfile = existsSync(path.join('.', 'Brocfile.js'));
    let buildFile = findBuildFile('ember-cli-build.js');

    if (hasBrocfile) {
      this.ui.writeDeprecateLine('Brocfile.js has been deprecated in favor of ember-cli-build.js. Please see the transition guide: https://github.com/ember-cli/ember-cli/blob/master/TRANSITION.md#user-content-brocfile-transition.');
      this.tree = require('broccoli-brocfile-loader')();
    } else if (buildFile) {
      this.tree = buildFile({ project: this.project });
    } else {
      throw new Error('No ember-cli-build.js found. Please see the transition guide: https://github.com/ember-cli/ember-cli/blob/master/TRANSITION.md#user-content-brocfile-transition.');
    }

    this.builder = new broccoli.Builder(this.tree);
  }

  /**
   * @private
   * @method trapSignals
   */
  trapSignals() {
    this._boundOnSIGINT = this.onSIGINT.bind(this);
    this._boundOnSIGTERM = this.onSIGTERM.bind(this);
    this._boundOnMessage = this.onMessage.bind(this);
    this._boundCleanup = this.cleanup.bind(this);

    process.on('SIGINT', this._boundOnSIGINT);
    process.on('SIGTERM', this._boundOnSIGTERM);
    process.on('message', this._boundOnMessage);
    exit.onExit(this._boundCleanup);

    if (/^win/.test(process.platform)) {
      this.trapWindowsSignals();
    }
  }

  _cleanupSignals() {
    process.removeListener('SIGINT', this._boundOnSIGINT);
    process.removeListener('SIGTERM', this._boundOnSIGTERM);
    process.removeListener('message', this._boundOnMessage);
    exit.offExit(this._boundCleanup);

    if (/^win/.test(process.platform)) {
      this._cleanupWindowsSignals();
    }
  }

  /**
   * @private
   * @method trapWindowsSignals
   */
  trapWindowsSignals() {
    // This is required to capture Ctrl + C on Windows
    if (process.stdin && process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      this._windowsCtrlCTrap = function(data) {
        if (data.length === 1 && data[0] === 0x03) {
          process.emit('SIGINT');
        }
      };
      process.stdin.on('data', this._windowsCtrlCTrap);
    }
  }

  _cleanupWindowsSignals() {
    if (this._windowsCtrlCTrap && process.stdin.removeListener) {
      process.stdin.removeListener('data', this._windowsCtrlCTrap);
    }
  }

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
  canDeleteOutputPath(outputPath) {
    let rootPathParents = [this.project.root];
    let dir = path.dirname(this.project.root);
    rootPathParents.push(dir);
    while (dir !== path.dirname(dir)) {
      dir = path.dirname(dir);
      rootPathParents.push(dir);
    }
    return rootPathParents.indexOf(outputPath) === -1;
  }

  /**
   * @private
   * @method copyToOutputPath
   * @param {String} inputPath
   */
  copyToOutputPath(inputPath) {
    let outputPath = this.outputPath;

    fs.mkdirsSync(outputPath);

    if (!this.canDeleteOutputPath(outputPath)) {
      throw new SilentError(`Using a build destination path of \`${outputPath}\` is not supported.`);
    }

    let sync = this._sync;
    if (sync === undefined) {
      this._sync = sync = new Sync(inputPath, path.resolve(this.outputPath));
    }

    let changes = sync.sync();

    return changes.map(op => op[1]);
  }

  /**
   * @private
   * @method processBuildResult
   * @param results
   * @return {Promise}
   */
  processBuildResult(results) {
    let self = this;

    return Promise.resolve()
      .then(() => self.copyToOutputPath(results.directory))
      .then(syncResult => {
        results.outputChanges = syncResult;
        return results;
      });
  }

  /**
   * @private
   * @method processAddonBuildSteps
   * @param buildStep
   * @param results
   * @return {Promise}
   */
  processAddonBuildSteps(buildStep, results) {
    let addonPromises = [];
    if (this.project && this.project.addons.length) {
      addonPromises = this.project.addons.map(addon => {
        if (addon[buildStep]) {
          return addon[buildStep](results);
        }
      }).filter(Boolean);
    }

    return Promise.all(addonPromises).then(() => results);
  }

  /**
   * @private
   * @method build
   * @return {Promise}
   */
  build(willReadStringDir, resultAnnotation) {
    this.project._instrumentation.start('build');

    let self = this;
    attemptNeverIndex('tmp');

    return this.processAddonBuildSteps('preBuild')
      .then(() => self.builder.build(willReadStringDir))
      .then(this.processAddonBuildSteps.bind(this, 'postBuild'))
      .then(this.processBuildResult.bind(this))
      .then(this.processAddonBuildSteps.bind(this, 'outputReady'))
      .then(result => {
        self.project._instrumentation.stopAndReport('build', result, resultAnnotation);
        return result;
      }, reason => {
        self.project._instrumentation.stopAndReport('build', null, resultAnnotation);
        throw reason;
      })
      .then(this.checkForPostBuildEnvironmentIssues.bind(this))
      .catch(error => {
        this.processAddonBuildSteps('buildError', error);
        throw error;
      });
  }

  /**
   * Delegates to the `cleanup` method of the wrapped Broccoli builder.
   *
   * @private
   * @method cleanup
   * @return {Promise}
   */
  cleanup() {
    let ui = this.project.ui;
    ui.startProgress('cleaning up');
    ui.writeLine('cleaning up...');

    // ensure any addon treeFor caches are reset
    _resetTreeCache();

    this._cleanupSignals();

    let node = heimdall.start({ name: 'Builder Cleanup' });

    return this.builder.cleanup().finally(() => {
      ui.stopProgress();
      node.stop();
    }).catch(err => {
      ui.writeLine(chalk.red('Cleanup error.'));
      ui.writeError(err);
    });
  }

  /**
   * Checks for issues in the environment that can't easily be detected until
   * after a build and issues any necessary deprecation warnings.
   *
   * - check for old (pre 0.1.4) versions of heimdalljs
   *
   * @private
   * @method checkForPostBuildEnvironmentIssues
   */
  checkForPostBuildEnvironmentIssues(value) {
    // 0.1.3 and prior used a global heimdall instance to share sessions
    // newer versions keep the session itself on process
    this.project.ui.writeDeprecateLine('Heimdalljs < 0.1.4 found.  Please remove old versions of heimdalljs and reinstall (you can find them with `npm ls heimdalljs` as long as you have nothing `npm link`d).  Performance instrumentation data will be incomplete until then.', !process._heimdall);

    return value;
  }

  /**
   * Handles the `SIGINT` signal.
   *
   * Calls {{#crossLink "Builder/cleanupAndExit:method"}}{{/crossLink}} by default.
   *
   * @private
   * @method onSIGINT
   */
  onSIGINT() {
    process.exit(1);
  }

  /**
   * Handles the `SIGTERM` signal.
   *
   * Calls {{#crossLink "Builder/cleanupAndExit:method"}}{{/crossLink}} by default.
   *
   * @private
   * @method onSIGTERM
   */
  onSIGTERM() {
    process.exit(1);
  }

  /**
   * Handles the `message` event on the `process`.
   *
   * Calls `process.exit` if the `kill` property on the `message` is set.
   *
   * @private
   * @method onMessage
   */
  onMessage(message) {
    if (message.kill) {
      process.exit(1);
    }
  }
}

module.exports = Builder;
