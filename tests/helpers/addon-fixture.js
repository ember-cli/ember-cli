'use strict';

var AppFixture = require('./app-fixture');

function AddonFixture(name, options) {
  this.type = 'addon';
  this.command = 'addon';
  this.name = name;
  this._installedAddons = [];

  this._init();
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
