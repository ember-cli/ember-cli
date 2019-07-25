'use strict';

const chalk = require('chalk');
const logger = require('heimdalljs-logger')('ember-cli:watcher');
const CoreObject = require('core-object');
const serveURL = require('../utilities/get-serve-url');
const { isExperimentEnabled } = require('../experiments');
const printSlowTrees = require('broccoli-slow-trees');
const promiseFinally = require('promise.prototype.finally');

const eventTypeNormalization = {
  add: 'added',
  delete: 'deleted',
  change: 'changed',
};

module.exports = class Watcher extends CoreObject {
  constructor(_options) {
    super(_options);

    this.verbose = true;

    let options = this.buildOptions();

    logger.info('initialize %o', options);

    this.serving = _options.serving;

    if (isExperimentEnabled('BROCCOLI_WATCHER')) {
      this.watcher = this.watcher || this.constructBroccoliWatcher(options);

      this.setupBroccoliChangeEvent();
      this.watcher.on('buildStart', this._setupBroccoliWatcherBuild.bind(this));
      this.watcher.on('buildSuccess', this.didChange.bind(this));
    } else {
      // This branch can be removed once BROCCOLI_WATCHER is enabled by default
      this.watcher = this.watcher || this.constructWatcher(options);
      this.watcher.on('change', this.didChange.bind(this));
    }

    this.watcher.on('error', this.didError.bind(this));
    this.serveURL = serveURL;
  }

  constructWatcher(options) {
    return new (require('ember-cli-broccoli-sane-watcher'))(this.builder, options);
  }

  constructBroccoliWatcher(options) {
    const { Watcher } = require('broccoli');
    const { watchedSourceNodeWrappers } = this.builder.builder;

    let watcher = new Watcher(this.builder, watchedSourceNodeWrappers, { saneOptions: options });

    watcher.start();

    return watcher;
  }

  setupBroccoliChangeEvent() {
    // This is to keep backwards compatiblity with broccoli-sane-watcher.
    // https://github.com/ember-cli/broccoli-sane-watcher/blob/48860/index.js#L158
    if (this.verbose) {
      this.watcher.on('change', (event, filePath) => {
        this.ui.writeLine(`file ${eventTypeNormalization[event]} ${filePath}`);
      });
    }
  }

  _setupBroccoliWatcherBuild() {
    let heimdallNode;

    promiseFinally(
      this.watcher.currentBuild.then(hash => {
        heimdallNode = hash.graph.__heimdall__;
        return hash;
      }),
      () => {
        // guard against `build` rejecting
        if (heimdallNode) {
          // remove the heimdall subtree for this build so we don't leak.  If
          // BROCCOLI_VIZ=1 then we have already output the json in `verboseOutput`.
          heimdallNode.remove();
        }
      }
    );
  }

  _totalTime(hash) {
    const sumNodes = (node, cb) => {
      let total = 0;
      node.visitPreOrder(node => {
        total += cb(node);
      });
      return total;
    };

    return sumNodes(hash.graph.__heimdall__, node => node.stats.time.self);
  }

  didError(error) {
    logger.info('didError %o', error);
    this.ui.writeError(error);
    this.analytics.trackError({
      description: error && error.name,
    });
  }

  didChange(results) {
    logger.info('didChange %o', results);

    if (isExperimentEnabled('BROCCOLI_WATCHER')) {
      results.totalTime = this._totalTime(results);
    }
    let totalTime = results.totalTime / 1e6;
    let message = chalk.green(`Build successful (${Math.round(totalTime)}ms)`);

    this.ui.writeLine('');

    if (this.serving) {
      message += ` – Serving on ${this.serveURL(this.options, this.options.project)}`;
    }

    this.ui.writeLine(message);

    this.analytics.track({
      name: 'ember rebuild',
      message: `broccoli rebuild time: ${totalTime}ms`,
    });

    /*
     * We use the `rebuild` category in our analytics setup for both builds
     * and rebuilds. This is a bit confusing, but the actual thing we
     * delineate on in the reports is the `variable` value below. This is
     * used both here and in `lib/tasks/build.js`.
     */
    this.analytics.trackTiming({
      category: 'rebuild',
      variable: 'rebuild time',
      label: 'broccoli rebuild time',
      value: Number(totalTime),
    });

    if (isExperimentEnabled('BROCCOLI_WATCHER') && this.verbose) {
      printSlowTrees(results.graph.__heimdall__);
    }
  }

  buildOptions() {
    let watcher = this.options && this.options.watcher;

    if (watcher && ['polling', 'watchman', 'node', 'events'].indexOf(watcher) === -1) {
      throw new Error(`Unknown watcher type --watcher=[polling|watchman|node|events] but was: ${watcher}`);
    }

    return {
      verbose: this.verbose,
      poll: watcher === 'polling',
      watchman: watcher === 'watchman' || watcher === 'events',
      node: watcher === 'node',
    };
  }

  then() {
    if (isExperimentEnabled('BROCCOLI_WATCHER')) {
      return this.watcher.currentBuild.then.apply(this.watcher.currentBuild, arguments);
    }

    return this.watcher.then.apply(this.watcher, arguments);
  }

  on() {
    const args = arguments;
    if (isExperimentEnabled('BROCCOLI_WATCHER') && args[0] === 'change' && !this.watchedDir) {
      args[0] = 'buildSuccess';
    }
    this.watcher.on.apply(this.watcher, args);
  }

  off() {
    const args = arguments;
    if (isExperimentEnabled('BROCCOLI_WATCHER') && args[0] === 'change' && !this.watchedDir) {
      args[0] = 'buildSuccess';
    }
    this.watcher.off.apply(this.watcher, args);
  }
};
