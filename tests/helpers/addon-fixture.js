'use strict';

const AppFixture = require('./app-fixture');

/**
 * The `AddonFixture` object leverages the similarities between itself and
 * `AppFixture to minimize its own set of custom helpers. It is used in the
 * same way and for the same reasons as `AppFixture`. Read documentation there.
 *
 * @class AddonFixture
 * @extends AppFixture
 */
function AddonFixture(name, options) {
  this.type = 'addon';
  this.command = 'addon';
  this.name = name;
  this._installedAddonFixtures = [];
  this.serialized = false;

  this._init();
}

AddonFixture.prototype = Object.create(AppFixture.prototype);
AddonFixture.prototype.constructor = AddonFixture;

/**
 * The `before` method of `AddonFixture` is used to set the `before` property
 * of an Ember Addon which we use to build up the directed acyclic graph to
 * determine the order of addon execution.
 *
 * Usage:
 *
 * ```
 * const AddonFixture = require.resolve('ember-cli/tests/helpers/addon-fixture');
 * let firstAddon = new AddonFixture('first');
 * let secondAddon = new AddonFixture('second');
 * firstAddon.before(secondAddon);
 * ```
 *
 * @method before
 * @param {AddonFixture} addon The addon which `this` should be before.
 */
AddonFixture.prototype.before = function(addon) {
  let config = this.getPackageJSON();
  config['ember-addon'].before = config['ember-addon'].before || [];
  config['ember-addon'].before.push(addon.name);
  this.setPackageJSON(config);
  return this;
};

/**
 * The `after` method of `AddonFixture` is used to set the `after` property
 * of an Ember Addon which we use to build up the directed acyclic graph to
 * determine the order of addon execution.
 *
 * Usage:
 *
 * ```
 * const AddonFixture = require.resolve('ember-cli/tests/helpers/addon-fixture');
 * let firstAddon = new AddonFixture('first');
 * let secondAddon = new AddonFixture('second');
 * firstAddon.after(secondAddon);
 * ```
 *
 * @method after
 * @param {AddonFixture} addon The addon which `this` should be after.
 */
AddonFixture.prototype.after = function(addon) {
  let config = this.getPackageJSON();
  config['ember-addon'].after = config['ember-addon'].after || [];
  config['ember-addon'].after.push(addon.name);
  this.setPackageJSON(config);
  return this;
};

/**
 * The `addMethod` method of `AddonFixture` is used to add a method to the
 * `index.js` of an Ember Addon mocked with an `AddonFixture`. This makes it
 * much easier to include fixture functions _inside of your test files_ which
 * are subject to normal JS parsing and linting for consistency to which the
 * rest of your addon under test is held.
 *
 * Usage:
 *
 * ```
 * const AddonFixture = require.resolve('ember-cli/tests/helpers/addon-fixture');
 * let myAddon = new AddonFixture('my-addon');
 *
 * // Write your method as if it were just a normal function in the test file.
 * const preprocessTreeFixture = function(type, tree) {
 *   return stew.log(tree);
 * };
 *
 * // In Node you're guaranteed consistent behavior of `toString` on functions.
 * myAddon.addMethod('preprocessTree', preprocessTreeFixture.toString());
 * ```
 *
 * @method addMethod
 * @param {String} methodName
 * @param {String} method
 */
AddonFixture.prototype.addMethod = function(methodName, method) {
  let marker = 'module.exports = {';
  method = `\n${methodName}: ${method},`;
  this.fixture['index.js'] = this.fixture['index.js'].replace(marker, marker + method);
  return this;
};

module.exports = AddonFixture;
