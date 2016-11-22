var fs = require('fs');
var path = require('path');

var fixturify = require('fixturify');
var quickTemp = require('quick-temp');
var merge = require('ember-cli-lodash-subset').merge;
var versionUtils = require('../../lib/utilities/version-utils');
var processTemplate = require('../../lib/utilities/process-template');

function AppFixture(name) {
  this.name = name;
  this.fixture = {};

  var context = {
    name: name,
    modulePrefix: name,
    emberCLIVersion: versionUtils.emberCLIVersion()
  };

  this._loadBlueprint('bower.json', context);
  this._loadBlueprint('package.json', context);
  this._loadBlueprint('ember-cli-build.js', context);
  this._loadBlueprint('config/environment.js', context);
}

AppFixture.prototype = {
  serialize: function() {
    quickTemp.makeOrRemake(this, 'dir');
    fixturify.writeSync(this.dir, this.fixture);
    return this;
  },
  clean: function() {
    quickTemp.remove(this, 'dir');
    return this;
  },

  _npmAddon: function(addon) {
    var config = this.getPackageJSON();
    var addonConfig = addon.getPackageJSON();

    this.fixture['node_modules'] = this.fixture['node_modules'] || {};
    if (!this.fixture['node_modules'][addonConfig.name]) {
      this.fixture['node_modules'][addonConfig.name] = addon.fixture;
    }

    config['dependencies'] = config['dependencies'] || {};
    config['dependencies'][addonConfig.name] = '*';
    this.setPackageJSON(config);

    return this;
  },
  _inRepoAddon: function(addon) {
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
  install: function(type, addon) {
    if (type === 'npm') {
      return this._npmAddon(addon);
    } else if (type === 'in-repo') {
      return this._inRepoAddon(addon);
    }
  },

  getPackageJSON: function() {
    return JSON.parse(this.fixture['package.json']);
  },
  setPackageJSON: function(value) {
    return this.fixture['package.json'] = JSON.stringify(value);
  },

  _generateFile: function(fileName, contents) {
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
  _loadBlueprint: function(fileName, context) {
    var target = path.join(__dirname, '..', '..', 'blueprints', 'app', 'files', fileName);
    var blueprintContents = fs.readFileSync(target, 'utf8');

    var content = processTemplate(blueprintContents, context);
    this._generateFile(fileName, content);
    return this;
  },
  _generateCSS: function(fileName) {
    var contents = '.' + this.name + ' { content: "' + fileName + '"; }';
    return this._generateFile(fileName, contents);
  },

  toJSON: function() {
    return this.fixture;
  }
};

module.exports = AppFixture;
