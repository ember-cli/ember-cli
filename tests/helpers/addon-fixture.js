var fs = require('fs');
var path = require('path');
var stringUtil = require('ember-cli-string-utils');

var AppFixture = require('./app-fixture');

var blueprintShim = require('./blueprint-shim');

function AddonFixture(name, options) {
  this.type = 'addon';
  this.name = name;
  this.options = options || {
    useGlobalPackages: true
  };

  this.blueprintPath = path.resolve(__dirname, '../../blueprints/addons');

  this.fixture = {};
  this._fixtureCache = {};
  this.dirs = {};

  this._generatePackageJSON();
  this._generateBowerJSON();

  var context = {
    addonModulePrefix: stringUtil.dasherize(this.name),
    dasherizedModuleName: stringUtil.dasherize(this.name)
  };
}

AddonFixture.prototype = Object.create(AppFixture.prototype);
AddonFixture.prototype.constructor = AddonFixture;

AddonFixture.prototype._generatePackageJSON = function() {
  this.fixture['package.json'] = blueprintShim['addon']['package.json'];
};

AddonFixture.prototype._generateBowerJSON = function() {
  this.fixture['bower.json'] = blueprintShim['addon']['bower.json'];
};

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
