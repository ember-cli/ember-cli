'use strict';

const quickTemp = require('quick-temp');
const Promise = require('rsvp').Promise;
let WATCHMAN_INFO = 'Visit https://ember-cli.com/user-guide/#watchman for more info.';
const semver = require('semver');
const SilentError = require('silent-error');

let POLLING = 'polling';
let WATCHMAN = 'watchman';
let NODE = 'node';
let EVENTS = 'events';
let POSSIBLE_WATCHERS = [
  POLLING,
  WATCHMAN,
  NODE,
  EVENTS,
];

let debug = require('heimdalljs-logger')('ember-cli:watcher');

class WatchPreference {
  constructor(watcher) {
    this.watcher = watcher || null;
    this._watchmanInfo = {
      enabled: false,
      version: null,
      canNestRoots: false,
    };
  }

  watchmanWorks(details) {
    this._watchmanInfo.enabled = true;
    this._watchmanInfo.version = details.version;
    this._watchmanInfo.canNestRoots = semver.satisfies(details.version, '>= 3.7.0');
  }

  get watchmanInfo() {
    return this._watchmanInfo;
  }
}

/*
 * @public
 *
 * A testable class that encapsulates which watch technique to use.
 */
class WatchDetector {
  constructor(options) {
    this.childProcess = options.childProcess;
    this.watchmanSupportsPlatform = options.watchmanSupportsPlatform;
    this.fs = options.fs;
    this.root = options.root;

    this.ui = options.ui;
    this.tmp = undefined;

    // This exists, because during tests repeadelty testing the same directories
    this._doesNodeWorkCache = options.cache || {};
  }

  /*
   * @public
   *
   * Detect if `fs.watch` provided by node is capable of observing a directory
   * within `process.cwd()`. Although `fs.watch` is provided as a part of the
   * node stdlib, their exists platforms it ships to that do not implement the
   * required sub-system. For example, there exists `posix` targets, without both
   * inotify and FSEvents
   *
   * @method testIfNodeWatcherAppearsToWork
   * @returns {Boolean) outcome
  */
  checkNodeWatcher() {
    let root = this.root;
    if (root in this._doesNodeWorkCache) {
      return this._doesNodeWorkCache[root];
    }

    this._doesNodeWorkCache[root] = false;
    try {
      // builds a tmp directory at process.cwd() + '/tmp/' + 'something-unique';
      let tmpDir = quickTemp.makeOrRemake(this, 'tmp');

      let watcher = this.fs.watch(tmpDir, { persistent: false, recursive: false });
      watcher.close();
    } catch (e) {
      debug.info('testing if node watcher failed with: %o', e);
      return false;
    } finally {
      try {
        quickTemp.remove(this, 'tmp');
        // cleanup dir
      } catch (e) {
        // not much we can do, lets debug log.
        debug.info('cleaning up dir failed with: %o', e);
      }
    }

    // it seems we where able to at least watch and unwatch, this should catch
    // systems that have a very broken NodeWatcher.
    //
    // NOTE: we could also add a more advance chance, that triggers a change
    // and expects to be informed of the change. This can be added in a future
    // iteration.
    //

    this._doesNodeWorkCache[root] = true;
    return true;
  }

  watcherFor(watcherType) {
    switch (watcherType) {
      case WATCHMAN:
        return this.getWatchmanWatcher();
      case NODE:
        return this.checkNodeWatcher() && new WatchPreference(NODE);
      case POLLING:
        return new WatchPreference(POLLING);
      case EVENTS:
        return this.watcherFor(WATCHMAN) || this.watcherFor(NODE);
      default:
        this.ui.writeLine(`Unknown watcher type: ${watcherType}`);
        return null;
    }
  }

  /*
   * @public
   *
   * Selecting the best watcher is complicated, this method (given a preference)
   * will test and provide the best possible watcher available to the current
   * system and project.
   *
   *  @method findBestWatcherOption
   *  @input {Object} options
   *  @returns {WatchPreference} watch preference
  */
  findBestWatcherOption(options) {
    let preference = options.watcher;

    if (preference && POSSIBLE_WATCHERS.indexOf(preference) === -1) {
      return Promise.reject(new SilentError(`Unknown Watcher: \`${preference}\` supported watchers: [${POSSIBLE_WATCHERS.join(', ')}]`));
    }

    let bestWatcher = this.watcherFor(preference) || this.watcherFor(WATCHMAN) || this.watcherFor(NODE) || this.watcherFor(POLLING);

    if (preference && preference !== bestWatcher.watcher) {
      this.ui.writeLine(`Could not use ${preference} watcher, falling back to ${bestWatcher.watcher}`);
    } else {
      this.ui.writeLine(`Selected ${bestWatcher.watcher} watcher`);
    }

    return bestWatcher;
  }

  /*
   * @public
   *
   * Although watchman may be selected, it may not work due to:
   *
   *  * invalid version
   *  * it may be broken in detectable ways
   *  * watchman executable may be something unexpected
   *  * ???
   *
   *  @method getWatchmanWatcher
   *  @returns {WatchPreference} or null
  */
  getWatchmanWatcher() {
    debug.info('execSync("watchman version")');
    try {
      let output = this.childProcess.execSync('watchman version', { stdio: [] });
      debug.info('watchman version STDOUT: %s', output);
      let version;

      try {
        version = JSON.parse(output).version;
      } catch (e) {
        debug.info(`Looks like you have a different program called watchman, see ${WATCHMAN_INFO}`);

        return null;
      }

      debug.info('detected watchman: %s', version);

      if (semver.satisfies(version, '>= 3.0.0')) {
        debug.info('watchman %s does satisfy: %s', version, '>= 3.0.0');

        let result = new WatchPreference(WATCHMAN);
        result.watchmanWorks({
          version,
          canNestRoots: semver.satisfies(version, '>= 3.7.0'),
        });

        return result;
      } else {
        debug.info(`Invalid watchman found, version: [${version}] did not satisfy [>= 3.0.0]. See ${WATCHMAN_INFO}`);

        return null;
      }
    } catch (reason) {
      debug.info('detecting watchman failed %o', reason);

      if (this.watchmanSupportsPlatform) {
        // don't bother telling windows users watchman detection failed, that is
        // until watchman is legit on windows.
      } else {
        debug.info('Could not start watchman. See #{WATCHMAN_INFO}');
      }

      return null;
    }
  }
}

module.exports = WatchDetector;
