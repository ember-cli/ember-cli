var fs = require('fs-extra');
var path = require('path');
var quickTemp = require('quick-temp');
var execSync = require('child_process').execSync;
var merge = require('ember-cli-lodash-subset').merge;
var Configstore = require('configstore');

var contents = require('./blueprint-shim');

/**
 * A simple tool to make behavior consistent between the `bower` and `yarn` commands.
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
 * The `yarn` command helper.
 *
 * @method yarn
 * @param {String} subcommand The subcommand to be passed into yarn.
 * @param {String} [...arguments] Arguments to be passed into the yarn subcommand.
 * @param {Object} [options={}] The options passed into child_process.execSync.
 *   (https://nodejs.org/api/child_process.html#child_process_child_process_execsync_command_options)
 */
var yarn = commandGenerator(require.resolve('yarn/bin/yarn.js'));

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

// This lookup exists to make it possible to look the commands up based upon context.
var commands = {
  yarn: yarn,
  bower: bower
};

// The definition list of translation terms.
var lookups = {
  path: {
    'bower': 'bower_components',
    'yarn': 'node_modules'
  },
  manifest: {
    'bower': 'bower.json',
    'yarn': 'package.json'
  },
  upgrade: {
    bower: 'update',
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
  this.dirs = this.dirs || {
    app: {
      bower_components: null,
      node_modules: null
    },
    addon: {
      bower_components: null,
      node_modules: null
    }
  };

  // These are the caches we're going to be building today.
  var caches = [
    ['app', 'bower'],
    ['app', 'yarn'],
    ['addon', 'bower'],
    ['addon', 'yarn']
  ];

  caches.forEach(function(tuple) {
    // Compare any existing manifest to the ideal per current blueprint.
    var identical = this.checkManifest.apply(this, tuple);

    if (identical) {
      // Use what we have, but opt in to SemVer drift.
      this.upgrade.apply(this, tuple);
    } else {
      // Tell the package manager to start semi-fresh.
      this.writeManifest.apply(this, tuple);
      this.install.apply(this, tuple);
    }
  }.bind(this));

  // Set up the default Ember CLI link.
  // Easier to do this every time than try and lock it out.
  var emberCLIPath = path.resolve(__dirname, '../..');
  yarn('link', { cwd: emberCLIPath });
}

PackageCache.prototype = {

  /**
   * The `getManifest` method processes the blueprint of the current
   * version of Ember CLI and returns the desired manifest file.
   *
   * @method {String} getManifest
   * @return {String} The manifest file.
   */
  getManifest: function(category, type) {
    return contents[category][translate(type, 'manifest')];
  },

  readManifest: function(category, type) {
    var readManifestDir = this.dirs[category][translate(type, 'path')];

    if (!readManifestDir) { return null; }

    var inputPath = path.join(readManifestDir, translate(type, 'manifest'));
    return fs.readFileSync(inputPath, 'utf8');
  },

  checkManifest: function(category, type) {
    var desiredManifest = this.getManifest(category, type);
    var cachedManifest = this.readManifest(category, type);

    return desiredManifest === cachedManifest;
  },

  writeManifest: function(category, type) {
    var outputDir = quickTemp.makeOrReuse(this.dirs[category], translate(type, 'path'));
    var keyPath = ['dirs', category, translate(type, 'path')].join('.');
    this._conf.set(keyPath, outputDir);

    var manifest = this.getManifest(category, type);
    var outputFile = path.join(outputDir, translate(type, 'manifest'));
    fs.writeFileSync(outputFile, manifest);

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

  install: function(category, type) {
    var executeLocation = this.dirs[category][translate(type, 'path')];
    commands[type]('install', { cwd: executeLocation });

    if (type === 'yarn') {
      // commands[type]('link', 'ember-cli', { cwd: executeLocation });
    }
  },

  upgrade: function(category, type) {
    var executeLocation = this.dirs[category][translate(type, 'path')];
    commands[type](translate(type, 'upgrade'), { cwd: executeLocation });
  },

  destroy: function(category, type) {
    quickTemp.remove(this.dirs[category], translate(type, 'path'));

    var keyPath = ['dirs', category, translate(type, 'path')].join('.');
    this._conf.set(keypath, null);
  }

};

var cache = new PackageCache();

module.exports = cache.dirs;
