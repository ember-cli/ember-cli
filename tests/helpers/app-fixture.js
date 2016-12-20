var fs = require('fs-extra');
var path = require('path');
var merge = require('ember-cli-lodash-subset').merge;

var fixturify = require('fixturify');
var quickTemp = require('quick-temp');

var originalWorkingDirectory = process.cwd();
var root = path.resolve(__dirname, '..', '..');

var PackageCache = require('../../tests/helpers/package-cache');
var CommandGenerator = require('../../tests/helpers/command-generator');

var packageCache = new PackageCache(root);
var ember = new CommandGenerator(path.join(root, 'bin', 'ember'));

var flags = [
  '--disable-analytics',
  '--watcher=node',
  '--skip-npm',
  '--skip-bower',
  '--skip-git'
];

function AppFixture(name) {
  this.type = 'app';
  this.name = name;

  process.chdir(root);
  this.dir = quickTemp.makeOrRemake({}, this.name + '-app-fixture');
  process.chdir(originalWorkingDirectory);

  ember.invoke('new', this.name, '--directory=' + this.dir, ...flags);
  this.fixture = fixturify.readSync(this.dir);
}

AppFixture.prototype = {
  serialize: function() {
    fixturify.writeSync(this.dir, this.fixture);
    return this;
  },
  clean: function() {
    // Build up object to pass to quickTemp.
    var dir = {};
    dir[this.name + '-app-fixture'] = this.dir;

    process.chdir(root);
    quickTemp.remove(dir, this.name + '-app-fixture');
    process.chdir(originalWorkingDirectory);

    return this;
  },

  _npmAddonInstall: function(addon) {
    var config = this.getPackageJSON();
    var addonConfig = addon.getPackageJSON();

    this.fixture['node_modules'] = this.fixture['node_modules'] || {};
    if (!this.fixture['node_modules'][addonConfig.name]) {
      this.fixture['node_modules'][addonConfig.name] = addon.fixture;
    }

    config['dependencies'] = config['dependencies'] || {};
    config['dependencies'][addonConfig.name] = '*';
    this.setPackageJSON(config);

    // TODO: Merge output files with PackageCache.

    return this;
  },
  _inRepoAddonInstall: function(addon) {
    var config = this.getPackageJSON();
    var addonConfig = addon.getPackageJSON();

    this.fixture['lib'] = this.fixture['lib'] || {};
    if (!this.fixture['lib'][addonConfig.name]) {
      this.fixture['lib'][addonConfig.name] = addon.fixture;
    }

    config['ember-addon'] = config['ember-addon'] || {};
    config['ember-addon']['paths'] = config['ember-addon']['paths'] || [];
    config['ember-addon'].paths.push('lib/' + addonConfig.name);
    this.setPackageJSON(config);

    return this;
  },
  install: function(addon) {
    if (addon.type === 'in-repo-addon') {
      return this._inRepoAddonInstall(addon);
    }

    if (addon.type === 'addon') {
      return this._npmAddonInstall(addon);
    }

    throw new Error('whoops');
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

  toJSON: function() {
    return this.fixture;
  }
};

module.exports = AppFixture;
