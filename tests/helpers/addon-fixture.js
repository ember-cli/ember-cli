var AppFixture = require('./app-fixture');

function AddonFixture() {
  AppFixture.apply(this, arguments);
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
