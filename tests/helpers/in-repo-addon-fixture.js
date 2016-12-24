'use strict';

var fs = require('fs-extra');
var path = require('path');
var fixturify = require('fixturify');

var originalWorkingDirectory = process.cwd();
var root = path.resolve(__dirname, '..', '..');

var CommandGenerator = require('../../tests/helpers/command-generator');
var ember = new CommandGenerator(path.join(root, 'bin', 'ember'));

var AddonFixture = require('./addon-fixture');

function InRepoAddonFixture(name) {
  this.type = 'in-repo-addon';
  this.command = null;
  this.name = name;
  this._installedAddons = [];

  this._init();
}

InRepoAddonFixture.prototype = Object.create(AddonFixture.prototype);
InRepoAddonFixture.prototype.constructor = InRepoAddonFixture;

InRepoAddonFixture.prototype._loadBlueprint = function() {
  fs.removeSync(this.dir);

  // Lie to the generator.
  fs.outputFileSync(path.join(this.dir, 'package.json'), '{}');
  fs.mkdirsSync(path.join(this.dir, 'node_modules'));

  process.chdir(this.dir);
  ember.invoke('generate', 'in-repo-addon', this.name);
  process.chdir(originalWorkingDirectory);
  this.fixture = fixturify.readSync(path.join(this.dir, 'lib', this.name));

  // Clean up after the generator.
  fs.removeSync(this.dir);
};

module.exports = InRepoAddonFixture;
