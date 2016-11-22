var fs = require('fs');
var path = require('path');

var AppFixture = require('./app-fixture');
var processTemplate = require('../../lib/utilities/process-template');

function AddonFixture(name) {
  this.name = name;
  this.fixture = {};
  this.dirs = {};

  this.setPackageJSON(this._generatePackageJSON());

  var context = {
    addonModulePrefix: name
  };

  this.loadBlueprint('index.js', context);
}

AddonFixture.prototype = Object.create(AppFixture.prototype);
AddonFixture.prototype.constructor = AddonFixture;

AddonFixture.prototype._generatePackageJSON = function(addon) {
  return {
    name: this.name,
    keywords: ['ember-addon'],
    'ember-addon': {}
  };
};

AddonFixture.prototype.loadBlueprint = function(fileName, context) {
  var target = path.join(__dirname, '..', '..', 'blueprints', 'addon', 'files', fileName);
  var blueprintContents = fs.readFileSync(target, 'utf8');

  var content = processTemplate(blueprintContents, context);
  this.generateFile(fileName, content);
  return this;
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
