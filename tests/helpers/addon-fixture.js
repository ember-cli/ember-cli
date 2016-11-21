var AppFixture = require('./app-fixture');

function generateStyleAddon(name) {
  var addonFixture = new AppFixture(name);
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

var foo = generateStyleAddon('foo');
var bar = generateStyleAddon('bar');

foo.install('in-repo', bar);
foo.serialize();
console.log(JSON.stringify(foo, undefined, 2));

module.exports = AppFixture;
