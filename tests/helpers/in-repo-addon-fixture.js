var fs = require('fs');
var path = require('path');
var stringUtil = require('ember-cli-string-utils');

var AddonFixture = require('./addon-fixture');
var processTemplate = require('../../lib/utilities/process-template');

function InRepoAddonFixture(name, options) {
  AddonFixture.call(this, name, { useGlobalPackages: false });
}

InRepoAddonFixture.prototype = Object.create(AddonFixture.prototype);
InRepoAddonFixture.prototype.constructor = InRepoAddonFixture;

InRepoAddonFixture.prototype._generatePackageJSON = function() {
  var context = {
    dasherizedModuleName: stringUtil.dasherize(this.name)
  };

  this.loadBlueprint('package.json', context);
};
InRepoAddonFixture.prototype._generateBowerJSON = function() {}

InRepoAddonFixture.prototype.loadBlueprint = function(fileName, context) {
  var target = path.join(__dirname, '..', '..', 'blueprints', 'in-repo-addon', 'files', 'lib', '__name__', fileName);
  var blueprintContents = fs.readFileSync(target, 'utf8');

  var content = processTemplate(blueprintContents, context);
  this.generateFile(fileName, content);
  return this;
};

module.exports = InRepoAddonFixture;
