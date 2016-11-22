var fs = require('fs');
var path = require('path');
var stringUtil = require('ember-cli-string-utils');
var execSync = require('child_process').execSync;
var symlinkOrCopySync = require('symlink-or-copy').sync;

var packageCache = require('./package-cache');

var fixturify = require('fixturify');
var quickTemp = require('quick-temp');
var merge = require('ember-cli-lodash-subset').merge;
var versionUtils = require('../../lib/utilities/version-utils');
var processTemplate = require('../../lib/utilities/process-template');

function AppFixture(name, options) {
  this.type = 'app';
  this.name = name;
  this.options = options || {
    useGlobalPackages: true
  };

  this.fixture = {};
  this._fixtureCache = {};
  this.dirs = {};

  var context = {
    name: stringUtil.dasherize(name),
    namespace: stringUtil.classify(name),
    modulePrefix: stringUtil.dasherize(name),
    emberCLIVersion: versionUtils.emberCLIVersion()
  };

  this.loadBlueprint('bower.json', context);
  this.loadBlueprint('package.json', context);
  this.loadBlueprint('ember-cli-build.js', context);
  this.loadBlueprint('config/environment.js', context);
  this.loadBlueprint('app/index.html', context);
  this.loadBlueprint('app/router.js', context);
  this.loadBlueprint('app/resolver.js', context);
  this.loadBlueprint('app/app.js', context);
}

AppFixture.prototype = {
  _bowerInstall: function() {
    if (this.options.useGlobalPackages) {
      symlinkOrCopySync(path.join(packageCache[this.type].bower_components, 'bower_components'), path.join(this.dirs.self, 'bower_components'));
      return;
    }

    // No need to perform a `bower install` if no packages are required.
    if (!this.fixture['bower.json']) { return; }

    // No need to perform a `bower install` if the previous bower.json is identical.
    if (this.fixture['bower.json'] === this._fixtureCache['bower.json']) { return; }

    // Save off the last seen `bower.json` to lock out additional installation attempts.
    this._fixtureCache['bower.json'] = this.fixture['bower.json'];

    quickTemp.makeOrReuse(this.dirs, 'bower_components');
    fs.writeFileSync(path.join(this.dirs.bower_components, 'bower.json'), this.fixture['bower.json']);

    execSync('bower install', { cwd: this.dirs.bower_components });
    symlinkOrCopySync(path.join(this.dirs.bower_components, 'bower_components'), path.join(this.dirs.self, 'bower_components'));
  },
  _npmInstall: function() {
    if (this.options.useGlobalPackages) {
      symlinkOrCopySync(path.join(packageCache[this.type].node_modules, 'node_modules'), path.join(this.dirs.self, 'node_modules'));
      return;
    }

    // No need to perform a `npm install` if no packages are required.
    if (!this.fixture['package.json']) { return; }

    // No need to perform a `npm install` if the previous package.json is identical.
    if (this.fixture['package.json'] === this._fixtureCache['package.json']) { return; }

    // Save off the last seen `package.json` to lock out additional installation attempts.
    this._fixtureCache['package.json'] = this.fixture['package.json'];

    quickTemp.makeOrReuse(this.dirs, 'node_modules');
    fs.writeFileSync(path.join(this.dirs.node_modules, 'package.json'), this.fixture['package.json']);

    // Manually link in Ember CLI.
    var emberCLIPath = path.resolve(__dirname, '../..');
    fs.mkdirSync(path.join(this.dirs.node_modules, 'node_modules'));
    symlinkOrCopySync(emberCLIPath, path.join(this.dirs.node_modules, 'node_modules', 'ember-cli'));

    // Install all the rest of the things.
    execSync('npm install --cache-min 300', { cwd: this.dirs.node_modules });
    symlinkOrCopySync(path.join(this.dirs.node_modules, 'node_modules'), path.join(this.dirs.self, 'node_modules'));
  },

  serialize: function() {
    quickTemp.makeOrRemake(this.dirs, 'self');
    fixturify.writeSync(this.dirs.self, this.fixture);

    // Wire up node_modules and bower_components.
    this._bowerInstall();
    this._npmInstall();

    return this;
  },
  clean: function() {
    quickTemp.remove(this.dirs, 'self');
    quickTemp.remove(this.dirs, 'bower_components');
    quickTemp.remove(this.dirs, 'node_modules');
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
  install: function(type, addon) {
    if (type === 'npm') {
      return this._npmAddonInstall(addon);
    } else if (type === 'in-repo') {
      return this._inRepoAddonInstall(addon);
    }
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
  loadBlueprint: function(fileName, context) {
    var target = path.join(__dirname, '..', '..', 'blueprints', 'app', 'files', fileName);
    var blueprintContents = fs.readFileSync(target, 'utf8');

    var content = processTemplate(blueprintContents, context);
    this.generateFile(fileName, content);
    return this;
  },

  toJSON: function() {
    return this.fixture;
  }
};

module.exports = AppFixture;
