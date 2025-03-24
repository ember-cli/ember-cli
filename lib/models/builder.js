'use strict';
const onProcessInterrupt = require('../utilities/will-interrupt-process');
const fs = require('fs-extra');
const path = require('path');
const CoreObject = require('core-object');
const SilentError = require('silent-error');
const chalk = require('chalk');
const findBuildFile = require('../utilities/find-build-file');
const _resetTreeCache = require('./addon')._resetTreeCache;
const Sync = require('tree-sync');
const heimdall = require('heimdalljs');
const progress = require('../utilities/heimdall-progress');

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

    this._instantiationStack = new Error().stack.replace(/[^\n]*\n/, '');
    this._cleanup = this.cleanup.bind(this);

    this._cleanupStarted = false;
    this._onProcessInterrupt = options.onProcessInterrupt || onProcessInterrupt;

    this._onProcessInterrupt.addHandler(this._cleanup);
  }

  /**
   * @private
   * @method readBuildFile
   * @param path The file path to read the build file from
   */
  async readBuildFile(path) {
    // Load the build file
    let buildFile = await findBuildFile(path);
    if (buildFile) {
      return await buildFile({ project: this.project });
    }

    throw new SilentError('No ember-cli-build.js found.');
  }

  async ensureBroccoliBuilder() {
    if (this.builder === undefined) {
      await this.setupBroccoliBuilder();
    }
  }

  /**
   * @private
   * @method setupBroccoliBuilder
   */
  async setupBroccoliBuilder() {
    this.environment = this.environment || 'development';
    process.env.EMBER_ENV = process.env.EMBER_ENV || this.environment;

    this.tree = await this.readBuildFile(this.project.root);

    const broccoli = require('broccoli');

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

    return changes.map((op) => op[1]);
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
          if (val) {
            sum.push(val);
          }
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
  async build(addWatchDirCallback, resultAnnotation) {
    await this.ensureBroccoliBuilder();

    let buildResults, uiProgressIntervalID;

    try {
      this.project._instrumentation.start('build');

      if (addWatchDirCallback) {
        for (let path of this.builder.watchedPaths) {
          addWatchDirCallback(path);
        }
      }

      this.ui.startProgress(progress.format(progress()));

      uiProgressIntervalID = setInterval(() => {
        this.ui.spinner.text = progress.format(progress());
      }, this.ui.spinner.interval);

      await this.processAddonBuildSteps('preBuild');

      try {
        await this.builder.build();

        // build legacy style results object (this is passed to various addon APIs)
        buildResults = {
          directory: this.builder.outputPath,
          graph: this.builder.outputNodeWrapper,
        };
      } catch (error) {
        this.throwFormattedBroccoliError(error);
      }

      await this.processAddonBuildSteps('postBuild', buildResults);

      let outputChanges = await this.copyToOutputPath(buildResults.directory);

      await this.processAddonBuildSteps(
        'outputReady',
        Object.assign({}, buildResults, { outputChanges, directory: this.outputPath })
      );

      return buildResults;
    } catch (error) {
      await this.processAddonBuildSteps('buildError', error);

      // Mark this as a builder error so the watcher knows it has been handled
      // and won't re-throw it
      error.isBuilderError = true;

      throw error;
    } finally {
      clearInterval(uiProgressIntervalID);
      this.ui.stopProgress();
      this.project._instrumentation.stopAndReport('build', buildResults, resultAnnotation);
      this.project.configCache.clear();
    }
  }

  /**
   * Delegates to the `cleanup` method of the wrapped Broccoli builder.
   *
   * @private
   * @method cleanup
   * @return {Promise}
   */
  async cleanup() {
    if (!this._cleanupStarted) {
      this._cleanupStarted = true;
      let ui = this.project.ui;
      ui.startProgress('cleaning up');
      ui.writeLine('cleaning up...');

      // ensure any addon treeFor caches are reset
      _resetTreeCache();

      this._onProcessInterrupt.removeHandler(this._cleanup);

      let node = heimdall.start({ name: 'Builder Cleanup' });
      try {
        await this.builder.cleanup();
      } catch (error) {
        ui.writeLine(chalk.red('Cleanup error.'));
        ui.writeError(error);
      } finally {
        ui.stopProgress();
        node.stop();
      }
    }
  }

  throwFormattedBroccoliError(err) {
    // TODO fix ember-cli/console-ui to handle current broccoli broccoliPayload
    let broccoliPayload = err && err.broccoliPayload;
    if (broccoliPayload) {
      if (!broccoliPayload.error) {
        let originalError = broccoliPayload.originalError || {};
        let location = broccoliPayload.location || originalError.location;
        broccoliPayload.error = {
          message: originalError.message,
          stack: originalError.stack,
          errorType: originalError.type || 'Build Error',
          codeFrame: originalError.codeFrame || originalError.message,
          location: location || {},
        };
      }
      if (!broccoliPayload.broccoliNode) {
        broccoliPayload.broccoliNode = {
          nodeName: broccoliPayload.nodeName,
          nodeAnnotation: broccoliPayload.nodeAnnotation,
          instantiationStack: broccoliPayload.instantiationStack || '',
        };
      }
      if (!broccoliPayload.versions) {
        broccoliPayload.versions = {
          broccoli: require('broccoli/package').version,
          node: process.version,
        };
      }
    }

    throw err;
  }
}

module.exports = Builder;
