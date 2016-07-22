'use strict';

var quickTemp = require('quick-temp');
var Promise = require('../ext/promise');
var WATCHMAN_INFO = 'Visit http://ember-cli.com/user-guide/#watchman for more info.';
var semver = require('semver');
var path = require('path');

var POLLING = 'polling';
var WATCHMAN = 'watchman';
var NODE = 'node';

var debug   = require('debug')('ember-cli:watcher');

function WatchPreference(watcher) {
  this.watcher = watcher || null;
  this._watchmanInfo = {
    enabled: false,
    version: null,
    canNestRoots: false
  };
}

WatchPreference.prototype.watchmanWorks = function(details) {
  this._watchmanInfo.enabled = true;
  this._watchmanInfo.version = details.version;
  this._watchmanInfo.canNestRoots = semver.satisfies(details.version, '>= 3.7.0');
};

Object.defineProperty(WatchPreference.prototype, 'watchmanInfo', {
  get: function() {
    return this._watchmanInfo;
  }
});

module.exports = WatchDetector;
/*
 * @public
 *
 * A testable class that encapsulates which watch technique to use.
 *
 */
function WatchDetector(options) {
  this.childProcess = options.childProcess;
  this.watchmanSupportsPlatform = options.watchmanSupportsPlatform;
  this.fs = options.fs;

  this.ui = options.ui;
  this.tmp = undefined;

  // This exists, because during tests repeadelty testing the same directories
  this._doesNodeWorkCache = options.cache || {};
}

/*
 * @private
 *
 * implements input options parsing and fallback.
 *
 * @method extractPreferenceFromOptions
 * @returns {WatchDetector)
*/
WatchDetector.prototype.extractPreferenceFromOptions = function(options) {
  if (options.watcher === POLLING) {
    debug('skip detecting watchman, "polling" was selected.');
    return new WatchPreference(POLLING);
  } else if (options.watcher === NODE) {
    debug('skip detecting watchman, "node" was selected.');
    return new WatchPreference(NODE);
  } else {
    debug('no watcher preference set, lets attempt watchman');
    return new WatchPreference(WATCHMAN);
  }
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
WatchDetector.prototype.testIfNodeWatcherAppearsToWork  = function() {
  return new Promise(function(resolve) {
    var key = path.dirname(path.dirname(process.cwd()));

    if (key in this._doesNodeWorkCache) {
      resolve(this._doesNodeWorkCache[key]);
      return;
    }

    this._doesNodeWorkCache[key] = false;
    try {
      // builds a tmp directory at process.cwd() + '/tmp/' + 'something-unique';
      var tmpDir = quickTemp.makeOrRemake(this, 'tmp');

      this.fs.watch(tmpDir, { persistent: false, recursive: false });
      this.fs.unwatch(tmpDir);
    } catch (e) {
      debug('testing if node watcher failed with: %o', e)
      resolve(false);
      return;
    } finally {
      try {
        quickTemp.remove(this, 'tmp');
        // cleanup dir
      } catch (e) {
        // not much we can do, lets debug log.
        debug('cleaning up dir failed with: %o', e)
      }
    }

    // it seems we where able to at least watch and unwatch, this should catch
    // systems that have a very broken NodeWatcher.
    //
    // NOTE: we could also add a more advance chance, that triggers a change
    // and expects to be informed of the change. This can be added in a future
    // iteration.
    //

    this._doesNodeWorkCache[key] = true;
    resolve(true);
  }.bind(this));
}

/*
 * @public
 *
 * Selecting the best watcher is complicated, this method (given a preference)
 * will test and provide the best possible watcher available to the current
 * system and project.
 *
 *
 *  @method findBestWatcherOption
 *  @input {Object} options
 *  @returns {Object} watch preference
*/
WatchDetector.prototype.findBestWatcherOption = function(options) {
  var preference = this.extractPreferenceFromOptions(options);
  var original = options.watcher;
  if (preference.watcher === WATCHMAN) {
    preference = this.checkWatchman();
  }

  return Promise.resolve(preference).then(function(bestOption) {
    if (bestOption.watcher === NODE) {
      // although up to this point, we may believe Node is the best watcher
      // this may not be true because:
      // * not all platforms that run node, support node.watch
      // * not all file systems support node watch
      //
      return this.testIfNodeWatcherAppearsToWork().then(function(appearsToWork) {
        return new WatchPreference(appearsToWork ? NODE : POLLING);
      });
    } else {
      return bestOption;
    }
  }.bind(this)).then(function(actual) {
    debug('foundBestWatcherOption, preference was: %o, actual: %o', options, actual);
    if (actual /* if no preference was initial set, don't bother informing the user */ &&
      original /* if no original was set, the fallback is expected */ &&
      actual.watcher !== original) {
      // if there was an initial preference, but we had to fall back inform the user.
      this.ui.writeLine('was unable to use: "' + original + '", fell back to: "' + actual.watcher + '"')
    }
    return actual;
  }.bind(this));
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
 *  @method checkWatchman
 *  @returns {Object} watch preference + _watchmanInfo
*/
WatchDetector.prototype.checkWatchman = function() {
  var result = new WatchPreference(null);

  debug('exev("watchman version")');
  return this.childProcess.exec('watchman version').then(function(output) {
    debug('watchman version STDOUT: %s', output);
    var version;
    try {
      version = JSON.parse(output).version;
    } catch (e) {
      this.ui.writeLine('Looks like you have a different program called watchman.');
      this.ui.writeLine(WATCHMAN_INFO);

      result.watcher = NODE;
      return result;
    }

    debug('detected watchman: %s', version);

    if (semver.satisfies(version, '>= 3.0.0')) {
      debug('watchman %s does satisfy: %s', version, '>= 3.0.0');

      result.watcher = WATCHMAN;

      result.watchmanWorks({
        version: version,
        canNestRoots: semver.satisfies(version, '>= 3.7.0')
      });
    } else {
      debug('watchman %s does NOT satisfy: %s', version, '>= 3.0.0');

      this.ui.writeLine('Invalid watchman found, version: [' + version + '] did not satisfy [>= 3.0.0].');
      this.ui.writeLine(WATCHMAN_INFO);

      result.watcher = NODE;
    }

    return result;
  }.bind(this), function(reason) {
    debug('detecting watchman failed %o', reason);

    if (this.watchmanSupportsPlatform) {
      // don't bother telling windows users watchman detection failed, that is
      // until watchman is legit on windows.
    } else {
      this.ui.writeLine('Could not start watchman');
      this.ui.writeLine(WATCHMAN_INFO);
    }

    result.watcher = NODE;
    return result;
  }.bind(this));
}
