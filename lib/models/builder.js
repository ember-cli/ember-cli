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

    // Use Broccoli 2.0 by default, if this fails due to .read/.rebuild API, fallback to broccoli-builder
    this.broccoliBuilderFallback = false;
    this.setupBroccoliBuilder();

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
  readBuildFile(path) {
    // Load the build file
    let buildFile = findBuildFile('ember-cli-build.js', path);
    if (buildFile) {
      return buildFile({ project: this.project });
    }

    throw new SilentError('No ember-cli-build.js found.');
  }

  /**
   * @private
   * @method setupBroccoliBuilder
   */
  setupBroccoliBuilder() {
    this.environment = this.environment || 'development';
    process.env.EMBER_ENV = process.env.EMBER_ENV || this.environment;

    this.tree = this.readBuildFile(this.project.root);

    let broccoli = require('broccoli');

    try {
      this.builder = new broccoli.Builder(this.tree);
      return;
    } catch (e) {
      // Catch here to trap InvalidNodeError. If this is thrown, it's because the node provided is not valid
      // and likely uses the old .read/.rebuild API, so fallback to broccoli-builder that supports that API
      if (
        !(e instanceof broccoli.Builder.InvalidNodeError) ||
        e.message.indexOf('The .read/.rebuild API is no longer supported as of Broccoli 1.0') === -1
      ) {
        throw e;
      }

      // Fallback to broccoli-builder
      let error = `Invalid Broccoli2 node detected, falling back to broccoli-builder. Broccoli error:\n`;
      error += `---------------\n`;
      error += e.message;
      error += `---------------\n`;
      this.ui.writeWarnLine(error);
    }

    broccoli = require('broccoli-builder');
    this.broccoliBuilderFallback = true;
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
    let buildResults, uiProgressIntervalID;

    try {
      this.project._instrumentation.start('build');

      if (addWatchDirCallback && !this.broccoliBuilderFallback) {
        for (let path of this.builder.watchedPaths) {
          addWatchDirCallback(path);
        }
      }

      this.ui.startProgress(progress.format(progress()));

      uiProgressIntervalID = setInterval(() => {
        this.ui.spinner.text = progress.format(progress());
      }, this.ui.spinner.interval);

      await this.processAddonBuildSteps('preBuild');

      if (this.broccoliBuilderFallback) {
        try {
          buildResults = await this.builder.build(addWatchDirCallback);
        } catch (error) {
          this.throwFormattedBroccoliError(error);
        }
      } else {
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
      }

      await this.processAddonBuildSteps('postBuild', buildResults);

      let outputChanges = await this.copyToOutputPath(buildResults.directory);

      await this.processAddonBuildSteps(
        'outputReady',
        Object.assign({}, buildResults, { outputChanges, directory: this.outputPath })
      );

      this.checkForPostBuildEnvironmentIssues();

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
    this.project.ui.writeDeprecateLine(
      'Heimdalljs < 0.1.4 found.  Please remove old versions of heimdalljs and reinstall (you can find them with `npm ls heimdalljs` as long as you have nothing `npm link`d).  Performance instrumentation data will be incomplete until then.',
      !process._heimdall
    );

    return value;
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
        let builderVersion = this.broccoliBuilderFallback
          ? require('broccoli-builder/package').version
          : require('broccoli/package').version;

        broccoliPayload.versions = {
          'broccoli-builder': builderVersion,
          node: process.version,
        };
      }
    }

    throw err;
  }
}

module.exports = Builder;
