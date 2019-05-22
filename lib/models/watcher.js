'use strict';

const chalk = require('chalk');
const logger = require('heimdalljs-logger')('ember-cli:watcher');
const CoreObject = require('core-object');
const serveURL = require('../utilities/get-serve-url');
const { isExperimentEnabled } = require('../experiments');
const printSlowTrees = require('broccoli-slow-trees');

const EVENT_ACTIONS = {
  add: 'added',
  change: 'changed',
  delete: 'deleted',
};

module.exports = class Watcher extends CoreObject {
  constructor(_options) {
    super(_options);

    this.verbose = true;

    let options = this.buildOptions();

    logger.info('initialize %o', options);

    this.serving = _options.serving;

    if (isExperimentEnabled('BROCCOLI_WATCHER')) {
      this.watcher = this.watcher || this._constructBroccoliWatcher(options);
      this.watcher.on('change', this._didChange.bind(this));
      this.watcher.on('buildStart', this._setupBroccoliWatcherBuild.bind(this));
      this.watcher.on('buildSuccess', this._didBuild.bind(this));
      this.watcher.start();
    } else {
      this.watcher = this.watcher || this._constructWatcher(options);
      this.watcher.on('change', this._didBuild.bind(this));
    }

    this.watcher.on('error', this._didError.bind(this));
    this.serveURL = serveURL;
  }

  _constructWatcher(options) {
    return new (require('ember-cli-broccoli-sane-watcher'))(this.builder, options);
  }

  _constructBroccoliWatcher(options) {
    return new (require('broccoli')).Watcher(this.builder, this.builder.builder.watchedSourceNodeWrappers, {
      saneOptions: options,
    });
  }

  _setupBroccoliWatcherBuild() {
    let heimdallNode;

    this.watcher.currentBuild
      .then(hash => {
        heimdallNode = hash.graph.__heimdall__;
        return hash;
      })
      .finally(() => {
        // guard against `build` rejecting
        if (heimdallNode) {
          // remove the heimdall subtree for this build so we don't leak.  If
          // BROCCOLI_VIZ=1 then we have already output the json in `verboseOutput`.
          heimdallNode.remove();
        }
      });
  }

  _totalTime(hash) {
    const sumNodes = (node, cb) => {
      let total = 0;
      node.visitPreOrder(node => {
        total += cb(node);
      });
      return total;
    };

    return sumNodes(hash.graph.__heimdall__, function(node) {
      return node.stats.time.self;
    });
  }

  _triggerBuild(hash) {
    logger.info('triggerBuildSuccess');
    this.watcher.emit('buildSuccess', hash);
    return hash;
  }

  _triggerError(error) {
    logger.info('triggerError %o', error);
    this.watcher.emit('error', error);
    throw error;
  }

  _didError(error) {
    logger.info('didError %o', error);
    this.ui.writeError(error);
    this.analytics.trackError({
      description: error && error.name,
    });
  }

  _didChange(event, filePath) {
    const action = EVENT_ACTIONS[event] || event;
    this.ui.writeLine(`file ${action} ${filePath}`);
  }

  _didBuild(results) {
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
      return this.watcher.currentBuild.apply(this.watcher.currentBuild, arguments);
    }

    return this.watcher.then.apply(this.build, arguments);
  }

  on() {
    this.watcher.on.apply(this.watcher, arguments);
  }

  off() {
    this.watcher.off.apply(this.watcher, arguments);
  }
};
