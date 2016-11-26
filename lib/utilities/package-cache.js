var fs = require('fs-extra');
var path = require('path');
var quickTemp = require('quick-temp');
var merge = require('ember-cli-lodash-subset').merge;
var Configstore = require('configstore');
var CommandGenerator = require('./command-generator');

/**
 * The `bower` command helper.
 *
 * @method bower
 * @param {String} subcommand The subcommand to be passed into bower.
 * @param {String} [...arguments] Arguments to be passed into the bower subcommand.
 * @param {Object} [options={}] The options passed into child_process.execSync.
 *   (https://nodejs.org/api/child_process.html#child_process_child_process_execsync_command_options)
 */
var bower = new CommandGenerator(require.resolve('bower/bin/bower'), {
  networkCommands: ['install', 'update']
}).invoke;

/**
 * The `npm` command helper.
 *
 * @method npm
 * @param {String} subcommand The subcommand to be passed into npm.
 * @param {String} [...arguments] Arguments to be passed into the npm subcommand.
 * @param {Object} [options={}] The options passed into child_process.execSync.
 *   (https://nodejs.org/api/child_process.html#child_process_child_process_execsync_command_options)
 */
var npm = new CommandGenerator(require.resolve('npm/bin/npm-cli.js'), {
  networkCommands: ['install', 'update']
}).invoke;

/**
 * The `yarn` command helper.
 *
 * @method yarn
 * @param {String} subcommand The subcommand to be passed into yarn.
 * @param {String} [...arguments] Arguments to be passed into the yarn subcommand.
 * @param {Object} [options={}] The options passed into child_process.execSync.
 *   (https://nodejs.org/api/child_process.html#child_process_child_process_execsync_command_options)
 */
var yarn = new CommandGenerator(require.resolve('yarn/bin/yarn.js'), {
  networkCommands: ['install', 'upgrade']
}).invoke;

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
 * The PackageCache wraps all package management functions. It also
 * handles initial global state setup.
 *
 * @class PackageCache
 * @constructor
 * @param {Object} options Options hash. Supports:
 *   {Boolean} linkEmberCLI=false If after installation should link Ember CLI.
 */
function PackageCache(options) {
  this._conf = new Configstore('package-cache');
  this.options = merge({
    linkEmberCLI: false
  }, options);

  // Wrap the Configstore in a pretty interface.
  Object.defineProperty(this, 'dirs', {
    get: function() {
      return this._conf.all;
    },
    set: function() {
      throw new Error('Must use the Configstore setter.');
    }
  });

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
    } catch(error) {
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
    var outputDir = quickTemp.makeOrReuse(this.dirs, label);
    this._conf.set(label, outputDir);

    var outputFile = path.join(outputDir, translate(type, 'manifest'));
    fs.writeFileSync(outputFile, manifest);

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
    var keys = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

    var key;
    for (var i = 0; i < keys.length; i++) {
      key = keys[i];
      if (JSON.stringify(parsedCached[key]) !== JSON.stringify(parsedNew[key])) {
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
    commands[type]('install', { cwd: this.dirs[label] });

    // Link in Ember CLI after installation.
    if (this.options.linkEmberCLI === true && (type === 'npm' || type === 'yarn')) {
      commands[type]('link', 'ember-cli', { cwd: this.dirs[label] });
    }
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
    // Unlink Ember CLI before upgrade.
    if (this.options.linkEmberCLI === true && (type === 'npm' || type === 'yarn')) {
      commands[type]('unlink', 'ember-cli', { cwd: this.dirs[label] });
    }

    // Only way to get repeatable behavior in npm: start over.
    // We turn an `_upgrade` task into an `_install` task.
    if (type === 'npm') {
      fs.removeSync(path.join(this.dirs[label], translate(type, 'path')));
      this._install(label, type);
    } else {
      commands[type](translate(type, 'upgrade'), { cwd: this.dirs[label] });

      // Re-link Ember CLI after upgrade.
      if (this.options.linkEmberCLI === true && (type === 'npm' || type === 'yarn')) {
        commands[type]('link', 'ember-cli', { cwd: this.dirs[label] });
      }
    }
  },

  // PUBLIC API BELOW

  /**
   * The `create` method adds a new package cache entry.
   *
   * @method create
   * @param {String} label The label for the cache.
   * @param {String} type The type of package cache.
   * @param {String} manifest The contents of the manifest file for the cache.
   * @return {String} The directory on disk which contains the cache.
   */
  create: function(label, type, manifest) {

    // TODO: Lock out upgrade calls after the first time accessing the cache.

    // Set up the default Ember CLI link.
    // Easier to do this every time than try and lock it out.
    if (this.options.linkEmberCLI === true && (type === 'npm' || type === 'yarn')) {
      var emberCLIPath = path.resolve(__dirname, '../..');
      commands[type]('link', { cwd: emberCLIPath });
    }

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
   * @return {String} The directory on disk which contains the cache.
   */
  update: function(label, type, manifest) {
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
    quickTemp.remove(this.dirs, label);

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
    var outputDir = quickTemp.makeOrReuse(this.dirs, toLabel);
    this._conf.set(toLabel, outputDir);

    fs.copySync(this.get(fromLabel), outputDir);

    return this.dirs[toLabel];
  }

};

module.exports = PackageCache;
