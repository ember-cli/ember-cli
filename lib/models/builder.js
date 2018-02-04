'use strict';
const onProcessInterrupt = require('../utilities/will-interrupt-process');
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
    this._instantiationStack = (new Error()).stack.replace(/[^\n]*\n/, '');
    this._cleanup = this.cleanup.bind(this);

    this._cleanupPromise = null;
    this._onProcessInterrupt = options.onProcessInterrupt || onProcessInterrupt;

    this._onProcessInterrupt.addHandler(this._cleanup);
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
      throw new SilentError('No ember-cli-build.js found.');
    }

    this.builder = new broccoli.Builder(this.tree);
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
    return Promise.resolve()
      .then(() => this.copyToOutputPath(results.directory))
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
      addonPromises = this.project.addons.reduce((sum, addon) => {
        let method = addon[buildStep];
        if (method) {
          let val = method.call(addon, results);
          if (val) { sum.push(val); }
        }
        return sum;
      }, []);
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

    attemptNeverIndex('tmp');

    return this.processAddonBuildSteps('preBuild')
      .then(() => this.builder.build(willReadStringDir))
      .then(this.processAddonBuildSteps.bind(this, 'postBuild'))
      .then(this.processBuildResult.bind(this))
      .then(this.processAddonBuildSteps.bind(this, 'outputReady'))
      .then(result => {
        this.project._instrumentation.stopAndReport('build', result, resultAnnotation);
        return result;
      }, reason => {
        this.project._instrumentation.stopAndReport('build', null, resultAnnotation);
        throw reason;
      })
      .then(this.checkForPostBuildEnvironmentIssues.bind(this))
      .catch(error => {
        this.processAddonBuildSteps('buildError', error);
        throw error;
      })
      .finally(this.finalizeBuild.bind(this));
  }

  /**
   * Delegates to the `cleanup` method of the wrapped Broccoli builder.
   *
   * @private
   * @method cleanup
   * @return {Promise}
   */
  cleanup() {
    if (!this._cleanupPromise) {
      let ui = this.project.ui;
      ui.startProgress('cleaning up');
      ui.writeLine('cleaning up...');

      // ensure any addon treeFor caches are reset
      _resetTreeCache();

      this._onProcessInterrupt.removeHandler(this._cleanup);

      let node = heimdall.start({ name: 'Builder Cleanup' });

      this._cleanupPromise = this.builder.cleanup().finally(() => {
        ui.stopProgress();
        node.stop();
      }).catch(err => {
        ui.writeLine(chalk.red('Cleanup error.'));
        ui.writeError(err);
      });
    }

    return this._cleanupPromise;
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
   * @private
   * @method finalizeBuild
   */
  finalizeBuild() {
    this.project.configCache.clear();
  }
}

module.exports = Builder;
