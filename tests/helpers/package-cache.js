var fs = require('fs-extra');
var path = require('path');
var quickTemp = require('quick-temp');
var execSync = require('child_process').execSync;
var symlinkOrCopySync = require('symlink-or-copy').sync;
var merge = require('ember-cli-lodash-subset').merge;

var contents = require('./blueprint-shim');

var Configstore = require('configstore');

function commandGenerator(program) {
  return function(command) {
    var options = arguments.length >= 2 ? arguments[arguments.length-1] : {};
    var args = Array.prototype.slice.call(arguments, 1, -1);

    var invocation = [];
    invocation.push(program);
    invocation.push(command);
    invocation = invocation.concat(args);

    execSync(invocation.join(' '), options);
  };
}

var commands = {
  yarn: commandGenerator(require.resolve('yarn/bin/yarn.js')),
  bower: commandGenerator(require.resolve('bower/bin/bower'))
}

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
function translate(type, lookup) { return lookups[lookup][type]; }

function PackageCache() {
  this.conf = new Configstore('package-cache');
  var dirs = this.conf.get('dirs');

  if (!dirs) {
    this.conf.set('dirs', {
      app: {
        bower_components: null,
        node_modules: null
      },
      addon: {
        bower_components: null,
        node_modules: null
      }
    });
  }

  var caches = [
    ['app', 'bower'],
    ['app', 'yarn'],
    ['addon', 'bower'],
    ['addon', 'yarn']
  ];

  caches.forEach(function(tuple) {
    var identical = this.checkManifest.apply(this, tuple);

    if (identical) {
      this.upgrade.apply(this, tuple);
    } else {
      this.writeManifest.apply(this, tuple);
      this.install.apply(this, tuple);
    }
  }.bind(this));

  // Set up the default Ember CLI link.
  var emberCLIPath = path.resolve(__dirname, '../..');
  commands.yarn('link', { cwd: emberCLIPath });
}

PackageCache.prototype = {

  getManifest: function(category, type) {
    return contents[category][translate(type, 'manifest')];
  },

  readManifest: function(category, type) {
    var dirs = this.conf.get('dirs');
    var readManifestDir = dirs[category][translate(type, 'path')];

    if (!readManifestDir) { return null; }

    var inputPath = path.join(readManifestDir, translate(type, 'manifest'));
    return fs.readFileSync(inputPath, 'utf8');
  },

  writeManifest: function(category, type) {
    var dirs = this.conf.get('dirs');

    var outputDir = quickTemp.makeOrReuse(dirs[category], translate(type, 'path'));
    var keyPath = ['dirs', category, translate(type, 'path')].join('.');
    this.conf.set(keyPath, outputDir);

    var manifest = this.getManifest(category, type);
    var outputFile = path.join(outputDir, translate(type, 'manifest'));
    fs.writeFileSync(outputFile, manifest);

    if (type === 'yarn') {
      unlinkSync(path.join(outputDir, 'yarn.lock'));
    }
  },

  checkManifest: function(category, type) {
    var desiredManifest = this.getManifest(category, type);
    var cachedManifest = this.readManifest(category, type);

    return desiredManifest === cachedManifest;
  },

  install: function(category, type) {
    var dirs = this.conf.get('dirs');

    var executeLocation = dirs[category][translate(type, 'path')];
    commands[type]('install', { cwd: executeLocation });

    if (type === 'yarn') {
      commands[type]('link', 'ember-cli', { cwd: executeLocation });
    }
  },

  upgrade: function(category, type) {
    var dirs = this.conf.get('dirs');

    var executeLocation = dirs[category][translate(type, 'path')];
    commands[type](translate(type, 'upgrade'), { cwd: executeLocation });
  },

  destroy: function(category, type) {
    var dirs = this.conf.get('dirs');

    quickTemp.remove(dirs[category], translate(type, 'path'));

    var keyPath = ['dirs', category, translate(type, 'path')].join('.');
    this.conf.set(keypath, null);
  }

};

var cache = new PackageCache();

module.exports = cache.conf.get('dirs');
