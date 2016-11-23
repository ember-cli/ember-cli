var fs = require('fs');
var path = require('path');
var stringUtil = require('ember-cli-string-utils');

var AddonFixture = require('./addon-fixture');

function InRepoAddonFixture(name, options) {
  AddonFixture.call(this, name, { useGlobalPackages: false });
}

InRepoAddonFixture.prototype = Object.create(AddonFixture.prototype);
InRepoAddonFixture.prototype.constructor = InRepoAddonFixture;

InRepoAddonFixture.prototype._generatePackageJSON = function() {
  var context = {
    dasherizedModuleName: stringUtil.dasherize(this.name)
  };
};

InRepoAddonFixture.prototype._generateBowerJSON = function() {}

module.exports = InRepoAddonFixture;
