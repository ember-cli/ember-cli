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

var AddonFixture = require('./addon-fixture');

function InRepoAddonFixture(name) {
  this.type = 'addon';
  this.name = name;

  process.chdir(root);
  this.dir = quickTemp.makeOrRemake({}, this.name + '-addon-fixture');
  process.chdir(originalWorkingDirectory);

  // Lie to the generator.
  fs.outputFileSync(path.join(this.dir, 'package.json'), '{}');
  fs.mkdirsSync(path.join(this.dir, 'node_modules'));

  process.chdir(this.dir);
  ember.invoke('generate', 'in-repo-addon', this.name);
  process.chdir(originalWorkingDirectory);
  this.fixture = fixturify.readSync(path.join(this.dir, 'lib', this.name));

  // Clean up after the generator.
  fs.removeSync(this.dir);
  fs.mkdirsSync(this.dir);

  // Always start serialized.
  this.serialize();
}

InRepoAddonFixture.prototype = Object.create(AddonFixture.prototype);
InRepoAddonFixture.prototype.constructor = InRepoAddonFixture;

module.exports = InRepoAddonFixture;
