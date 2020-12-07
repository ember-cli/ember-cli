'use strict';

const chalk = require('chalk');
const logger = require('heimdalljs-logger')('ember-cli:watcher');
const CoreObject = require('core-object');
const serveURL = require('../utilities/get-serve-url');
const printSlowTrees = require('broccoli-slow-trees');

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

    this.watcher = this.watcher || this.constructBroccoliWatcher(options);

    this.setupBroccoliChangeEvent();
    this.watcher.on('buildStart', this._setupBroccoliWatcherBuild.bind(this));
    this.watcher.on('buildSuccess', this.didChange.bind(this));

    // build errors arriving via watcher
    this.watcher.on('buildFailure', this.didError.bind(this));
    // watcher specific errors
    this.watcher.on('error', this.didError.bind(this));

    this.serveURL = serveURL;
  }

  constructBroccoliWatcher(options) {
    const { Watcher } = require('broccoli');
    const { watchedSourceNodeWrappers } = this.builder.builder;

    let watcher = new Watcher(this.builder, watchedSourceNodeWrappers, { saneOptions: options, ignored: this.ignored });

    watcher.start();

    return watcher;
  }

  setupBroccoliChangeEvent() {
    // This is to keep backwards compatibility with broccoli-sane-watcher.
    // https://github.com/ember-cli/broccoli-sane-watcher/blob/48860/index.js#L158
    if (this.verbose) {
      this.watcher.on('change', (event, filePath) => {
        this.ui.writeLine(`file ${eventTypeNormalization[event]} ${filePath}`);
      });
    }
  }

  async _setupBroccoliWatcherBuild() {
    try {
      const hash = await this.watcher.currentBuild;
      hash.graph.__heimdall__.remove();
    } catch (e) {
      if (e !== null && typeof e === 'object' && e.isBuilderError === true) {
        // e must be a builder error which we can safely ignore.
        //
        // Builder errors are expected failures which are handled and presented
        // to the user else-where. To prevent double reporting faliures to the
        // user, it is important that we ignore them here as this functions
        // single responsibilty is to reset the himedall state after each build.
        //
        // exists to prune heimdall data after a build. Those errors are
        // reported elsewhere.
        //
      } else {
        // this error is unexpected, we must re-throw as we cannot be sure it
        // has been handled else-where
        throw e;
      }
    }
  }

  _totalTime(hash) {
    const sumNodes = (node, cb) => {
      let total = 0;
      node.visitPreOrder((node) => {
        total += cb(node);
      });
      return total;
    };

    return sumNodes(hash.graph.__heimdall__, (node) => node.stats.time.self);
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

    results.totalTime = this._totalTime(results);
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

    if (this.verbose) {
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
    return this.watcher.currentBuild.then.apply(this.watcher.currentBuild, arguments);
  }

  on() {
    const args = arguments;
    if (args[0] === 'change' && !this.watchedDir) {
      args[0] = 'buildSuccess';
    }
    this.watcher.on.apply(this.watcher, args);
  }

  off() {
    const args = arguments;
    if (args[0] === 'change' && !this.watchedDir) {
      args[0] = 'buildSuccess';
    }
    this.watcher.off.apply(this.watcher, args);
  }
};
