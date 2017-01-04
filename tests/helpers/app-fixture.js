'use strict';

var fs = require('fs-extra');
var path = require('path');
var symlinkOrCopySync = require('symlink-or-copy').sync;
var merge = require('ember-cli-lodash-subset').merge;

var fixturify = require('fixturify');
var quickTemp = require('quick-temp');

var originalWorkingDirectory = process.cwd();
var root = path.resolve(__dirname, '..', '..');

var PackageCache = require('../../tests/helpers/package-cache');
var CommandGenerator = require('../../tests/helpers/command-generator');

var ember = new CommandGenerator(path.join(root, 'bin', 'ember'));

function AppFixture(name) {
  this.type = 'app';
  this.command = 'new';
  this.name = name;
  this._installedAddons = [];

  this._init();
}

AppFixture.prototype = {

  _init: function() {
    process.chdir(root);
    this.dir = quickTemp.makeOrRemake({}, this.name + '-' + this.type + '-fixture');
    process.chdir(originalWorkingDirectory);

    this._loadBlueprint();
  },

  _loadBlueprint: function() {
    fs.removeSync(this.dir);

    ember.invoke(
      this.command,
      this.name,
      '--directory=' + this.dir,
      '--disable-analytics',
      '--watcher=node',
      '--skip-npm',
      '--skip-bower',
      '--skip-git'
    );

    this.fixture = fixturify.readSync(this.dir);

    // Clean up after the generator.
    fs.removeSync(this.dir);
  },

  serialize: function(isChild) {
    // Default link ember-cli.
    var npmLinks = [{
      name: 'ember-cli',
      path: root
    }];
    var inRepoLinks = [];
    var self = this;
    this._installedAddons.forEach(function(addon) {
      addon.serialize(true);

      if (addon.type === 'addon') {
        npmLinks.push({
          name: addon.name,
          path: addon.dir
        });
      } else if (addon.type === 'in-repo-addon') {
        inRepoLinks.push({
          from: path.join(self.dir, 'lib', addon.name),
          to: addon.dir
        });
      }
    });

    fixturify.writeSync(this.dir, this.fixture);

    var packageCache = new PackageCache(root);

    var from, to;
    if (this.fixture['package.json'] || npmLinks.length) {
      var nodePackageCache;
      if (isChild) {
        process.env.NODE_ENV = 'production';
        nodePackageCache = packageCache.create(this.type + '-production-node', 'yarn', this.fixture['package.json'], npmLinks);
        delete process.env.NODE_ENV;
      } else {
        nodePackageCache = packageCache.create(this.type + '-node', 'yarn', this.fixture['package.json'], npmLinks);
      }

      from = path.join(nodePackageCache, 'node_modules');
      fs.mkdirsSync(from); // Just in case the path doesn't exist.
      to = path.join(this.dir, 'node_modules');
      symlinkOrCopySync(from, to);
    }

    if (!isChild && this.fixture['bower.json']) {
      var bowerPackageCache = packageCache.create(this.type + '-bower', 'bower', this.fixture['bower.json']);

      from = path.join(bowerPackageCache, 'bower_components');
      fs.mkdirsSync(from); // Just in case the path doesn't exist.
      to = path.join(this.dir, 'bower_components');
      symlinkOrCopySync(from, to);
    }

    inRepoLinks.forEach(function(link) {
      fs.mkdirsSync(path.dirname(link.from)); // Just in case the path doesn't exist.
      fs.mkdirsSync(path.dirname(link.to)); // Just in case the path doesn't exist.
      symlinkOrCopySync(link.to, link.from);
    });

    return this;
  },

  clean: function() {
    this._installedAddons.forEach(function(addon) {
      addon.clean(true);
    });

    // Build up object to pass to quickTemp.
    var dir = {};
    dir[this.name + '-' + this.type + '-fixture'] = this.dir;

    process.chdir(root);
    quickTemp.remove(dir, this.name + '-' + this.type + '-fixture');
    process.chdir(originalWorkingDirectory);

    return this;
  },

  install: function(addon) {
    this._installedAddons.push(addon);

    if (addon.type === 'addon') {
      return this._npmAddonInstall(addon);
    }

    if (addon.type === 'in-repo-addon') {
      return this._inRepoAddonInstall(addon);
    }

    throw new Error('Cannot install addon.');
  },

  _npmAddonInstall: function(addon) {
    var config = this.getPackageJSON();

    config['dependencies'] = config['dependencies'] || {};
    config['dependencies'][addon.name] = '*';

    this.setPackageJSON(config);
    return this;
  },

  _inRepoAddonInstall: function(addon) {
    var config = this.getPackageJSON();

    config['ember-addon'] = config['ember-addon'] || {};
    config['ember-addon']['paths'] = config['ember-addon']['paths'] || [];
    config['ember-addon'].paths.push('lib/' + addon.name);

    this.setPackageJSON(config);
    return this;
  },

  uninstall: function(addon) {
    var needle = addon;
    var haystack = this._installedAddons;

    if (haystack.indexOf(needle) !== -1) {
      this._installedAddons.splice(haystack.indexOf(needle), 1);
    }

    if (addon.type === 'addon') {
      return this._npmAddonUninstall(addon);
    }

    if (addon.type === 'in-repo-addon') {
      return this._inRepoAddonUninstall(addon);
    }

    throw new Error('Cannot uninstall addon.');
  },

  _npmAddonUninstall: function(addon) {
    var config = this.getPackageJSON();

    config['dependencies'] = config['dependencies'] || {};
    delete config['dependencies'][addon.name];

    this.setPackageJSON(config);
    return this;
  },

  _inRepoAddonUninstall: function(addon) {
    var config = this.getPackageJSON();

    var needle = 'lib/' + addon.name;
    var haystack = config['ember-addon']['paths'];

    if (haystack.indexOf(needle) !== -1) {
      config['ember-addon']['paths'].splice(haystack.indexOf(needle), 1);
    }

    this.setPackageJSON(config);
    return this;
  },

  getPackageJSON: function() {
    return JSON.parse(this.fixture['package.json']);
  },

  setPackageJSON: function(value) {
    return this.fixture['package.json'] = JSON.stringify(value);
  },

  generateFile: function(fileName, contents) {
    fileName = fileName.replace(/^\//, '');
    var keyPath = fileName.split('/');

    var root = {};
    var cursor = root;
    for (var i = 0; i < keyPath.length - 1; i++) {
      cursor = cursor[keyPath[i]] = {};
    }
    cursor[keyPath[i]] = contents;

    merge(this.fixture, root);
    return this;
  },

  generateCSS: function(fileName) {
    var contents = '.' + this.name + ' { content: "' + fileName + '"; }';
    return this.generateFile(fileName, contents);
  },

  generateJS: function(fileName) {
    var contents = [
      '// ' + this.name + '/' + fileName,
      'var a = true;'
    ];
    return this.generateFile(fileName, contents.join('\n'));
  },

  generateTemplate: function(fileName) {
    var contents = '{{' + this.name + '}}';
    return this.generateFile(fileName, contents);
  }
};

module.exports = AppFixture;
