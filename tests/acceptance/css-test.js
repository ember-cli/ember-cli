'use strict';

var AppFixture = require('../helpers/app-fixture');
var AddonFixture = require('../helpers/addon-fixture');

function generateRootApplication(name) {
  return new AppFixture(name);
}

function generateStyleAddon(name) {
  var addonFixture = new AddonFixture(name);
  addonFixture._generateCSS('app/styles/addon.css');
  addonFixture._generateCSS('app/styles/app.css');
  addonFixture._generateCSS('app/styles/_import.css');
  addonFixture._generateCSS('app/styles/' + addonFixture.name + '.css');
  addonFixture._generateCSS('app/styles/alpha.css');
  addonFixture._generateCSS('app/styles/zeta.css');
  addonFixture._generateCSS('addon/styles/addon.css');
  addonFixture._generateCSS('addon/styles/app.css');
  addonFixture._generateCSS('addon/styles/_import.css');
  addonFixture._generateCSS('addon/styles/' + addonFixture.name + '.css');
  addonFixture._generateCSS('addon/styles/alpha.css');
  addonFixture._generateCSS('addon/styles/zeta.css');

  return addonFixture;
}

var root = generateRootApplication('root');
var foo = generateStyleAddon('foo');
root.install('npm', foo);
// root.serialize();

console.log(JSON.stringify(root, undefined, 2));
