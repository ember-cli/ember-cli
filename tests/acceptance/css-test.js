'use strict';

var AppFixture = require('../helpers/app-fixture');
var AddonFixture = require('../helpers/addon-fixture');

var acceptance = require('../helpers/acceptance');
var createTestTargets = acceptance.createTestTargets;
var teardownTestTargets = acceptance.teardownTestTargets;
var linkDependencies = acceptance.linkDependencies;
var cleanupRun = acceptance.cleanupRun;

var chai = require('../chai');
var expect = chai.expect;

function generateRootApplication(name) {
  var appFixture = new AppFixture(name);

  appFixture.generateCSS('app/styles/app.css');
  appFixture.generateCSS('app/styles/addon.css');
  appFixture.generateCSS('app/styles/_import.css');
  // appFixture.generateCSS('app/styles/' + appFixture.name + '.css');
  appFixture.generateCSS('app/styles/alpha.css');
  appFixture.generateCSS('app/styles/zeta.css');

  return appFixture;
}

function generateStyleAddon(name) {
  var addonFixture = new AddonFixture(name);
  addonFixture.generateCSS('app/styles/app.css');
  addonFixture.generateCSS('app/styles/addon.css');
  addonFixture.generateCSS('app/styles/_import.css');
  addonFixture.generateCSS('app/styles/' + addonFixture.name + '.css');
  addonFixture.generateCSS('app/styles/alpha.css');
  addonFixture.generateCSS('app/styles/zeta.css');
  addonFixture.generateCSS('addon/styles/addon.css');
  addonFixture.generateCSS('addon/styles/app.css');
  addonFixture.generateCSS('addon/styles/_import.css');
  addonFixture.generateCSS('addon/styles/' + addonFixture.name + '.css');
  addonFixture.generateCSS('addon/styles/alpha.css');
  addonFixture.generateCSS('addon/styles/zeta.css');

  return addonFixture;
}

var root = generateRootApplication('root');
var foo = generateStyleAddon('foo');
// root.install('npm', foo);
root.serialize();
console.log(root.dirs.self);

describe('Acceptance: CSS file generation.', function() {
  before(function() {});
  after(function() {});
  beforeEach(function() {});
  afterEach(function() {});

  it('generates CSS files', function() {

  });
});
