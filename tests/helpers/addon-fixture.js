var fs = require('fs-extra');
var path = require('path');

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

var AppFixture = require('./app-fixture');

function AddonFixture(name, options) {
  this.type = 'addon';
  this.name = name;

  process.chdir(root);
  this.dir = quickTemp.makeOrRemake({}, this.name + '-addon-fixture');
  process.chdir(originalWorkingDirectory);

  ember.invoke('addon', this.name, '--directory=' + this.dir, ...flags);
  this.fixture = fixturify.readSync(this.dir);
}

AddonFixture.prototype = Object.create(AppFixture.prototype);
AddonFixture.prototype.constructor = AddonFixture;

AddonFixture.prototype.before = function(addon) {
  var config = this.getPackageJSON();
  config['ember-addon'].before = config['ember-addon'].before || [];
  config['ember-addon'].before.push(addon.name);
  this.setPackageJSON(config);
  return this;
};

AddonFixture.prototype.after = function(addon) {
  var config = this.getPackageJSON();
  config['ember-addon'].after = config['ember-addon'].after || [];
  config['ember-addon'].after.push(addon.name);
  this.setPackageJSON(config);
  return this;
};

module.exports = AddonFixture;
