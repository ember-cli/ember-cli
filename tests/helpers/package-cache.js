var fs = require('fs-extra');
var path = require('path');
var quickTemp = require('quick-temp');
var execSync = require('child_process').execSync;
var merge = require('ember-cli-lodash-subset').merge;
var Configstore = require('configstore');
var traverse = require('traverse');

/**
 * A simple tool to make behavior consistent between the package manager commands.
 *
 * @method commandGenerator
 * @param {Path} program The path to the command.
 * @return {Function} A command helper.
 */
function commandGenerator(program) {
  var networkSubcommands = ['install', 'update', 'upgrade'];

  return function(subcommand) {
    var options = arguments.length >= 2 ? arguments[arguments.length-1] : {};
    var args = Array.prototype.slice.call(arguments, 1, -1);

    var invocation = [];

    // Make network tasks more resilient on Travis CI.
    if (process.env.TRAVIS === 'true' && ~networkCommands.indexOf(subcommand)) {
      invocation.push('travis_retry');
    }

    invocation.push(program);
    invocation.push(subcommand);
    invocation = invocation.concat(args);

    execSync(invocation.join(' '), options);
  };
}

/**
 * The `bower` command helper.
 *
 * @method bower
 * @param {String} subcommand The subcommand to be passed into bower.
 * @param {String} [...arguments] Arguments to be passed into the bower subcommand.
 * @param {Object} [options={}] The options passed into child_process.execSync.
 *   (https://nodejs.org/api/child_process.html#child_process_child_process_execsync_command_options)
 */
var bower = commandGenerator(require.resolve('bower/bin/bower'));

/**
 * The `npm` command helper.
 *
 * @method npm
 * @param {String} subcommand The subcommand to be passed into npm.
 * @param {String} [...arguments] Arguments to be passed into the npm subcommand.
 * @param {Object} [options={}] The options passed into child_process.execSync.
 *   (https://nodejs.org/api/child_process.html#child_process_child_process_execsync_command_options)
 */
var npm = commandGenerator(require.resolve('npm/bin/npm-cli.js'));

/**
 * The `yarn` command helper.
 *
 * @method yarn
 * @param {String} subcommand The subcommand to be passed into yarn.
 * @param {String} [...arguments] Arguments to be passed into the yarn subcommand.
 * @param {Object} [options={}] The options passed into child_process.execSync.
 *   (https://nodejs.org/api/child_process.html#child_process_child_process_execsync_command_options)
 */
var yarn = commandGenerator(require.resolve('yarn/bin/yarn.js'));

// This lookup exists to make it possible to look the commands up based upon context.
var commands = {
  bower: bower,
  npm: npm,
  yarn: yarn
};

// The definition list of translation terms.
var lookups = {
  path: {
    bower: 'bower_components',
    npm: 'node_modules',
    yarn: 'node_modules'
  },
  manifest: {
    bower: 'bower.json',
    npm: 'package.json',
    yarn: 'package.json'
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
 * @param {String} type Either 'yarn' or 'bower'.
 * @param {String} lookup Either 'path', 'manifest', or 'upgrade'.
 */
function translate(type, lookup) { return lookups[lookup][type]; }


/**
 * The PackageCache wraps all package management functions. It also
 * handles initial global state setup.
 *
 * @class PackageCache
 * @constructor
 */
function PackageCache() {
  this._conf = new Configstore('package-cache');

  // Wrap the Configstore in a pretty interface.
  Object.defineProperty(this, 'dirs', {
    get: function() {
      return this._conf.get('dirs');
    },
    set: function(newValue) {
      return this._conf.set('dirs', newValue);
    }
  });

  // Either use the version from the cache or start fresh.
  this.dirs = this.dirs || {};

  // FIXME:
  // this._cleanDirs();
}

PackageCache.prototype = {

  /**
   * The `_cleanDirs` method deals with sync issues between the
   * Configstore and what exists on disk. Non-existent directories
   * are removed from `this.dirs`.
   *
   * @method _cleanDirs
   */
  _cleanDirs: function() {
    this.dirs = traverse(this.dirs).map(function(directory) {
      if (this.isLeaf && directory && !fs.existsSync(directory)) {
        this.update(null);
      }
    });
  },

  /**
   * The `readManifest` method reads the on-disk manifest for the current
   * cache and returns its value.
   *
   * @method readManifest
   * @param {String} label The label for the cache.
   * @param {String} type The type of package cache.
   * @return {String} The manifest file contents on disk.
   */
  readManifest: function(label, type) {
    var readManifestDir = this.dirs[label];

    if (!readManifestDir) { return null; }

    var inputPath = path.join(readManifestDir, translate(type, 'manifest'));
    return fs.readFileSync(inputPath, 'utf8');
  },

  /**
   * The `checkManifest` method compares the desired manifest to that which
   * exists in the cache.
   *
   * @method checkManifest
   * @param {String} label The label for the cache.
   * @param {String} type The type of package cache.
   * @param {String} manifest The contents of the manifest file to compare to cache.
   * @return {Boolean} `true` if identical.
   */
  checkManifest: function(label, type, manifest) {
    var cachedManifest = this.readManifest(label, type);

    return manifest === cachedManifest;
  },

  /**
   * The `writeManifest` method generates the on-disk folder for the package cache
   * and saves the manifest into it. If it is a yarn package cache it will remove
   * the existing lock file.
   *
   * @method writeManifest
   * @param {String} label The label for the cache.
   * @param {String} type The type of package cache.
   * @param {String} manifest The contents of the manifest file to write to disk.
   */
  writeManifest: function(label, type, manifest) {
    var outputDir = quickTemp.makeOrReuse(this.dirs, label);
    var keyPath = ['dirs', label].join('.');
    this._conf.set(keyPath, outputDir);

    var outputFile = path.join(outputDir, translate(type, 'manifest'));
    fs.writeFileSync(outputFile, manifest);

    // Remove the yarn.lock file so that it doesn't try to incorrectly use it as a base.
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
   * The `install` method installs the contents of the manifest into the
   * specified package cache.
   *
   * @method install
   * @param {String} label The label for the cache.
   * @param {String} type The type of package cache.
   */
  install: function(label, type) {
    commands[type]('install', { cwd: this.dirs[label] });

    // FIXME: yarn doesn't like this after one round of re-installation.
    if (type === 'yarn') {
      // commands[type]('link', 'ember-cli', { cwd: this.dirs[label] });
    }
  },

  /**
   * The `upgrade` method guarantees that the contents of the manifest are
   * allowed to drift in a SemVer compatible manner. It ensures that CI is
   * always running against the latest versions of all dependencies.
   *
   * @method upgrade
   * @param {String} label The label for the cache.
   * @param {String} type The type of package cache.
   */
  upgrade: function(label, type) {
    // Only way to get repeatable behavior in npm: start over.
    // We turn an `upgrade` task into an `install` task.
    if (type === 'npm') {
      fs.removeSync(path.join(this.dirs[label], translate(type, 'path')));
      this.install(label, type);
    } else {
      commands[type](translate(type, 'upgrade'), { cwd: this.dirs[label] });
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
    // Compare any existing manifest to the ideal per current blueprint.
    var identical = this.checkManifest(label, type, manifest);

    if (identical) {
      // Use what we have, but opt in to SemVer drift.
      this.upgrade(label, type);
    } else {
      // Tell the package manager to start semi-fresh.
      this.writeManifest(label, type, manifest);
      this.install(label, type);
    }

    return this.dirs[label];

    // Set up the default Ember CLI link.
    // Easier to do this every time than try and lock it out.
    // var emberCLIPath = path.resolve(__dirname, '../..');
    // yarn('link', { cwd: emberCLIPath });
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

    var keyPath = ['dirs', label].join('.');
    this._conf.set(keypath, null);
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
    var keyPath = ['dirs', toLabel].join('.');
    this._conf.set(keyPath, outputDir);

    fs.copySync(this.get(fromLabel), outputDir);

    return this.dirs[toLabel];
  }

};

var test = new PackageCache();
var contents = require('./blueprint-shim');
test.create('app-node', 'yarn', contents['app']['package.json']);
test.create('app-bower', 'bower', contents['app']['bower.json']);
test.create('addon-node', 'yarn', contents['addon']['package.json']);
test.create('addon-bower', 'bower', contents['addon']['bower.json']);

module.exports = PackageCache;
