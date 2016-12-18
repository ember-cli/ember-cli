'use strict';

var fs = require('fs-extra');
var path = require('path');
var quickTemp = require('quick-temp');
var merge = require('ember-cli-lodash-subset').merge;
var Configstore = require('configstore');
var CommandGenerator = require('./command-generator');
var stableStringify = require('json-stable-stringify');

var originalWorkingDirectory = process.cwd();

// Module scoped variable to store whether a particular cache has been
// attempted to be upgraded.
var upgraded = {};

// List of keys which can result in things being installed.
var DEPENDENCY_KEYS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

/**
 * The `bower` command helper.
 *
 * @method bower
 * @param {String} subcommand The subcommand to be passed into bower.
 * @param {String} [...arguments] Arguments to be passed into the bower subcommand.
 * @param {Object} [options={}] The options passed into child_process.spawnSync.
 *   (https://nodejs.org/api/child_process.html#child_process_child_process_spawnsync_command_args_options)
 */
var bower = new CommandGenerator(require.resolve('bower/bin/bower'));

/**
 * The `npm` command helper.
 *
 * @method npm
 * @param {String} subcommand The subcommand to be passed into npm.
 * @param {String} [...arguments] Arguments to be passed into the npm subcommand.
 * @param {Object} [options={}] The options passed into child_process.spawnSync.
 *   (https://nodejs.org/api/child_process.html#child_process_child_process_spawnsync_command_args_options)
 */
var npm = new CommandGenerator(require.resolve('npm/bin/npm-cli.js'));

/**
 * The `yarn` command helper.
 *
 * @method yarn
 * @param {String} subcommand The subcommand to be passed into yarn.
 * @param {String} [...arguments] Arguments to be passed into the yarn subcommand.
 * @param {Object} [options={}] The options passed into child_process.spawnSync.
 *   (https://nodejs.org/api/child_process.html#child_process_child_process_spawnsync_command_args_options)
 */
var yarn = new CommandGenerator('yarn');

// This lookup exists to make it possible to look the commands up based upon context.
var originals;
var commands = {
  bower: bower,
  npm: npm,
  yarn: yarn
};

// The definition list of translation terms.
var lookups = {
  manifest: {
    bower: 'bower.json',
    npm: 'package.json',
    yarn: 'package.json'
  },
  path: {
    bower: 'bower_components',
    npm: 'node_modules',
    yarn: 'node_modules'
  },
  upgrade: {
    bower: 'update',
    npm: 'install',
    yarn: 'upgrade'
  }
};

/**
 * The `translate` command is used to turn a consistent argument into
 * appropriate values based upon the context in which it is used. It's
 * a convenience helper to avoid littering lookups throughout the code.
 *
 * @method translate
 * @param {String} type Either 'bower', 'npm', or 'yarn'.
 * @param {String} lookup Either 'manifest', 'path', or 'upgrade'.
 */
function translate(type, lookup) { return lookups[lookup][type]; }

/**
 * The `checkDowngrade` command is used to turn a request for `yarn` into `npm`
 * if it is unsupported on that platform.
 *
 * @method checkDowngrade
 * @param {String} type Either 'bower', 'npm', or 'yarn'.
 */
function checkDowngrade(type) {
  // The only thing we support that doesn't support `yarn` is v0.12
  if (type === 'yarn' && process.version.indexOf('v0.12') === 0) {
    type = 'npm';
  }
  return type;
}

/**
 * The PackageCache wraps all package management functions. It also
 * handles initial global state setup.
 *
 * Usage:
 *
 * ```
 * var cache = new PackageCache();
 * var dir = cache.create('your-cache', 'yarn', '{
 *   "dependencies": {
 *     "lodash": "*",
 *     "ember-cli": "*"
 *   }
 * }');
 * // => process.cwd()/tmp/your-cache-A3B4C6D
 * ```
 *
 * This will generate a persistent cache which contains the results
 * of a clean installation of the `dependencies` as you specified in
 * the manifest argument. It will save the results of these in a
 * temporary folder, returned as `dir`. On a second invocation
 * (in the same process, or in a subsequent run) PackageCache will first
 * compare the manifest to the previously installed one, using the manifest
 * as the cache key, and make a decision as to the fastest way to get
 * the cache up-to-date. PackageCache guarantees that your cache will
 * always be up-to-date.
 *
 * If done in the same process, this simply returns the existing cache
 * directory with no change, making the following invocation simply a
 * cache validation check:
 *
 * ```
 * var dir2 = cache.create('your-cache', 'yarn', '{
 *   "dependencies": {
 *     "lodash": "*",
 *     "ember-cli": "*"
 *   }
 * }');
 * // => process.cwd()/tmp/your-cache-A3B4C6D
 * ```
 *
 * If you wish to modify a cache you can do so using the `update` API:
 *
 * ```
 * var dir3 = cache.update('your-cache', 'yarn', '{
 *   "dependencies": {
 *     "": "*",
 *     "lodash": "*",
 *     "ember-cli": "*"
 *   }
 * }');
 * // => process.cwd()/tmp/your-cache-A3B4C6D
 * ```
 *
 * Underneath the hood `create` and `update` are identical–which
 * makes clear the simplicity of this tool. It will always do the
 * right thing. You can think of the outcome of any `create` or
 * `update` call as identical to `rm -rf node_modules && npm install`
 * except as performant as possible.
 *
 * If you need to make modifications to a cache but wish to retain
 * the original you can invoke the `clone` command:
 *
 * ```
 * var newDir = cache.clone('your-cache', 'modified-cache');
 * var manifest = fs.readJsonSync(path.join(newDir, 'package.json'));
 * manifest.dependencies['express'] = '*';
 * cache.update('modified-cache', 'yarn', JSON.stringify(manifest));
 * // => process.cwd()/tmp/modified-cache-F8D5C8B
 * ```
 *
 * This mental model makes it easy to prevent coding mistakes, state
 * leakage across multiple test runs by making multiple caches cheap,
 * and has tremendous performance benefits.
 *
 * You can even programatically update a cache:
 *
 * ```
 * var CommandGenerator = require('./command-generator');
 * var yarn = new CommandGenerator(require.resolve('yarn/bin/yarn.js'));
 *
 * var dir = cache.create('your-cache', 'yarn', '{ ... }');
 *
 * yarn.invoke('add', 'some-addon', { cwd: dir });
 * ```
 *
 * The programmatic approach enables the entire set of usecases that
 * the underlying package manager supports while continuing to wrap it
 * in a persistent cache. You should not directly modify any files in the
 * cache other than the manifest unless you really know what you're doing as
 * that can put the cache into a possibly invalid state.
 *
 * As the only caveat, PackageCache _is_ persistent. The consuming
 * code is responsible for ensuring that the cache size does not
 * grow unbounded.
 *
 * @class PackageCache
 * @constructor
 * @param {String} rootPath Root of the directory for `PackageCache`.
 */
function PackageCache(rootPath) {
  this.rootPath = rootPath || originalWorkingDirectory;

  this._conf = new Configstore('package-cache');

  // The default invocation will write something we don't use.
  // Remove it:
  fs.unlinkSync(this._conf.path);

  // Set it to where we want it to be.
  this._conf.path = path.join(this.rootPath, 'tmp', 'package-cache.json');

  // Initialize.
  this._conf.all = this._conf.all;

  this._cleanDirs();
}

PackageCache.prototype = {

  /**
   * The `__setupForTesting` modifies things in module scope.
   *
   * @method __setupForTesting
   */
  __setupForTesting: function(stubs) {
    originals = commands;
    commands = stubs.commands;
  },

  /**
   * The `__resetForTesting` puts things back in module scope.
   *
   * @method __resetForTesting
   */
  __resetForTesting: function() {
    commands = originals;
  },

  /**
   * The `_cleanDirs` method deals with sync issues between the
   * Configstore and what exists on disk. Non-existent directories
   * are removed from `this.dirs`.
   *
   * @method _cleanDirs
   */
  _cleanDirs: function() {
    var labels = Object.keys(this.dirs);

    var label, directory;
    for (var i = 0; i < labels.length; i++) {
      label = labels[i];
      directory = this.dirs[label];
      if (!fs.existsSync(directory)) {
        this._conf.delete(label);
      }
    }
  },

  /**
   * The `_readManifest` method reads the on-disk manifest for the current
   * cache and returns its value.
   *
   * @method _readManifest
   * @param {String} label The label for the cache.
   * @param {String} type The type of package cache.
   * @return {String} The manifest file contents on disk.
   */
  _readManifest: function(label, type) {
    var readManifestDir = this.dirs[label];

    if (!readManifestDir) { return null; }

    var inputPath = path.join(readManifestDir, translate(type, 'manifest'));

    var result = null;
    try {
      result = fs.readFileSync(inputPath, 'utf8');
    } catch (error) {
      // Swallow non-exceptional errors.
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    return result;
  },

  /**
   * The `_writeManifest` method generates the on-disk folder for the package cache
   * and saves the manifest into it. If it is a yarn package cache it will remove
   * the existing lock file.
   *
   * @method _writeManifest
   * @param {String} label The label for the cache.
   * @param {String} type The type of package cache.
   * @param {String} manifest The contents of the manifest file to write to disk.
   */
  _writeManifest: function(label, type, manifest) {
    process.chdir(this.rootPath);
    var outputDir = quickTemp.makeOrReuse(this.dirs, label);
    process.chdir(originalWorkingDirectory);

    this._conf.set(label, outputDir);

    var outputFile = path.join(outputDir, translate(type, 'manifest'));
    fs.outputFileSync(outputFile, manifest);

    // Remove any existing yarn.lock file so that it doesn't try to incorrectly use it as a base.
    if (type === 'yarn') {
      try {
        fs.unlinkSync(path.join(outputDir, 'yarn.lock'));
      } catch (error) {
        // Catch unexceptional error but rethrow if something is truly wrong.
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }
  },

  /**
   * The `_removeLinks` method removes from the dependencies of the manifest the
   * assets which will be linked in so that we don't duplicate install. It saves
   * off the values in the internal `PackageCache` metadata for restoration after
   * linking as those values may be necessary.
   *
   * It is also responsible for removing these links prior to making any changes
   * to the specified cache.
   *
   * @method _removeLinks
   * @param {String} label The label for the cache.
   * @param {String} type The type of package cache.
   */
  _removeLinks: function(label, type) {
    var cachedManifest = this._readManifest(label, type);
    if (!cachedManifest) { return; }

    var jsonManifest = JSON.parse(cachedManifest);
    var links = jsonManifest._packageCache.links;

    // Blindly remove existing links whether or not they appear in the manifest.
    var packageName;
    for (var i = 0; i < links.length; i++) {
      packageName = links[i];
      commands[type].invoke('unlink', packageName, { cwd: this.dirs[label] });
    }

    // Remove things from the manifest which we know we'll link back in.
    var removed = {};
    var key;
    for (i = 0; i < DEPENDENCY_KEYS.length; i++) {
      key = DEPENDENCY_KEYS[i];
      for (var j = 0; j < links.length; j++) {
        packageName = links[j];
        if (jsonManifest[key] && jsonManifest[key][packageName]) {
          removed[key] = removed[key] || {};
          removed[key][packageName] = jsonManifest[key][packageName];

          delete jsonManifest[key][packageName];
        }
      }
    }

    jsonManifest._packageCache.removed = removed;
    var manifest = JSON.stringify(jsonManifest);

    this._writeManifest(label, type, manifest);
  },

  /**
   * The `_restoreLinks` method restores the dependencies from the internal
   * `PackageCache` metadata so that the manifest matches its original state after
   * performing the links.
   *
   * It is also responsible for restoring these links into the `PackageCache`.
   *
   * @method _restoreLinks
   * @param {String} label The label for the cache.
   * @param {String} type The type of package cache.
   */
  _restoreLinks: function(label, type) {
    var cachedManifest = this._readManifest(label, type);
    if (!cachedManifest) { return; }

    var jsonManifest = JSON.parse(cachedManifest);
    var links = jsonManifest._packageCache.links;

    // Blindly restore links.
    var packageName;
    for (var i = 0; i < links.length; i++) {
      packageName = links[i];
      commands[type].invoke('link', packageName, { cwd: this.dirs[label] });
    }

    // Promote any removed items back into the manifest.
    jsonManifest = merge(jsonManifest, jsonManifest._packageCache.removed);

    // Get rid of the key.
    delete jsonManifest._packageCache.removed;

    // Serialize back to disk.
    var manifest = JSON.stringify(jsonManifest);
    this._writeManifest(label, type, manifest);
  },

  /**
   * The `_checkManifest` method compares the desired manifest to that which
   * exists in the cache.
   *
   * @method _checkManifest
   * @param {String} label The label for the cache.
   * @param {String} type The type of package cache.
   * @param {String} manifest The contents of the manifest file to compare to cache.
   * @return {Boolean} `true` if identical.
   */
  _checkManifest: function(label, type, manifest) {
    var cachedManifest = this._readManifest(label, type);

    if (cachedManifest === null) { return false; }

    var parsedCached = JSON.parse(cachedManifest);
    var parsedNew = JSON.parse(manifest);

    // Only inspect the keys we care about.
    // Invalidate the cache based off the private _packageCache key as well.
    var keys = [].concat(DEPENDENCY_KEYS, '_packageCache');

    var key;
    for (var i = 0; i < keys.length; i++) {
      key = keys[i];
      if (stableStringify(parsedCached[key]) !== stableStringify(parsedNew[key])) {
        return false;
      }
    }

    return true;
  },

  /**
   * The `_install` method installs the contents of the manifest into the
   * specified package cache.
   *
   * @method _install
   * @param {String} label The label for the cache.
   * @param {String} type The type of package cache.
   */
  _install: function(label, type) {
    type = checkDowngrade(type);

    this._removeLinks(label, type);
    commands[type].invoke('install', { cwd: this.dirs[label] });
    this._restoreLinks(label, type);

    // If we just did a clean install we can treat it as up-to-date.
    upgraded[label] = true;
  },

  /**
   * The `_upgrade` method guarantees that the contents of the manifest are
   * allowed to drift in a SemVer compatible manner. It ensures that CI is
   * always running against the latest versions of all dependencies.
   *
   * @method _upgrade
   * @param {String} label The label for the cache.
   * @param {String} type The type of package cache.
   */
  _upgrade: function(label, type) {
    type = checkDowngrade(type);

    // Lock out upgrade calls after the first time upgrading the cache.
    if (upgraded[label]) { return; }

    // Only way to get repeatable behavior in npm: start over.
    // We turn an `_upgrade` task into an `_install` task.
    if (type === 'npm') {
      fs.removeSync(path.join(this.dirs[label], translate(type, 'path')));
      return this._install(label, type);
    }

    this._removeLinks(label, type);
    commands[type].invoke(translate(type, 'upgrade'), { cwd: this.dirs[label] });
    this._restoreLinks(label, type);

    upgraded[label] = true;
  },

  // PUBLIC API BELOW

  /**
   * The `create` method adds a new package cache entry.
   *
   * @method create
   * @param {String} label The label for the cache.
   * @param {String} type The type of package cache.
   * @param {String} manifest The contents of the manifest file for the cache.
   * @param {Array} links Packages to elide for install and link.
   * @return {String} The directory on disk which contains the cache.
   */
  create: function(label, type, manifest, links) {
    type = checkDowngrade(type);
    links = links || [];

    // Save metadata about the PackageCache invocation in the manifest.
    var packageManagerVersion = commands[type].invoke('--version').stdout;

    var jsonManifest = JSON.parse(manifest);
    jsonManifest._packageCache = {
      node: process.version,
      packageManager: type,
      packageManagerVersion: packageManagerVersion,
      links: links
    };

    manifest = JSON.stringify(jsonManifest);

    // Compare any existing manifest to the ideal per current blueprint.
    var identical = this._checkManifest(label, type, manifest);

    if (identical) {
      // Use what we have, but opt in to SemVer drift.
      this._upgrade(label, type);
    } else {
      // Tell the package manager to start semi-fresh.
      this._writeManifest(label, type, manifest);
      this._install(label, type);
    }

    return this.dirs[label];
  },

  /**
   * The `update` method aliases the `create` method.
   *
   * @method update
   * @param {String} label The label for the cache.
   * @param {String} type The type of package cache.
   * @param {String} manifest The contents of the manifest file for the cache.
   * @param {Array} links Packages to elide for install and link.
   * @return {String} The directory on disk which contains the cache.
   */
  update: function(/*label, type, manifest, links*/) {
    return this.create.apply(this, arguments);
  },

  /**
   * The `get` method returns the directory for the cache.
   *
   * @method get
   * @param {String} label The label for the cache.
   * @return {String} The directory on disk which contains the cache.
   */
  get: function(label) {
    return this.dirs[label];
  },

  /**
   * The `destroy` method removes all evidence of the package cache.
   *
   * @method destroy
   * @param {String} label The label for the cache.
   * @param {String} type The type of package cache.
   */
  destroy: function(label) {
    process.chdir(this.rootPath);
    quickTemp.remove(this.dirs, label);
    process.chdir(originalWorkingDirectory);

    this._conf.delete(label);
  },

  /**
   * The `clone` method duplicates a cache. Some package managers can
   * leverage a pre-existing state to speed up their installation.
   *
   * @method destroy
   * @param {String} fromLabel The label for the cache to clone.
   * @param {String} toLabel The label for the new cache.
   */
  clone: function(fromLabel, toLabel) {
    process.chdir(this.rootPath);
    var outputDir = quickTemp.makeOrReuse(this.dirs, toLabel);
    process.chdir(originalWorkingDirectory);

    this._conf.set(toLabel, outputDir);

    fs.copySync(this.get(fromLabel), outputDir);

    return this.dirs[toLabel];
  }

};

// Wrap the Configstore in a pretty interface.
Object.defineProperty(PackageCache.prototype, 'dirs', {
  get: function() {
    return this._conf.all;
  }
});

module.exports = PackageCache;
