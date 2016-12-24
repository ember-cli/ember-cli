'use strict';

var path = require('path');

var AppFixture = require('../helpers/app-fixture');
var AddonFixture = require('../helpers/addon-fixture');
var InRepoAddonFixture = require('../helpers/in-repo-addon-fixture');

var setupPreprocessorRegistryFixture = function(type, registry) {
  var stew = require('broccoli-stew');
  var addon = this;

  registry.add('<%= type %>', {
    name: '<%= name %>' + '-' + type,
    ext: '<%= ext %>',
    toTree: function(tree) {
      return stew.map(tree, function(content, relativePath) {
        return '// <%= name %>' + '-' + type + '\n' + content;
      });
    }
  });
};

var processTemplate = require('../../lib/utilities/process-template');
function generatePreprocessor(context) {
  return processTemplate(setupPreprocessorRegistryFixture.toString(), context);
}

var root = path.resolve(__dirname, '..', '..');
var CommandGenerator = require('../../tests/helpers/command-generator');
var ember = new CommandGenerator(path.join(root, 'bin', 'ember'));

var chai = require('../chai');
var expect = chai.expect;

describe.only('Acceptance: nested preprocessor tests.', function() {
  this.timeout(1000*60*1);
  var root;

  before(function() {
    root = new AppFixture('root');

    var types = ['js', 'css', 'template'];
    var extensions = ['js', 'css', 'hbs'];

    var name, type, ext;
    var inRepoAddons = {};
    var nestedInRepoAddons = {};
    for (var i = 0; i < types.length; i++) {
      type = types[i];
      ext = extensions[i];
      name = type + '-addon';

      inRepoAddons[type] = new InRepoAddonFixture(name);
      inRepoAddons[type].addMethod('setupPreprocessorRegistry', generatePreprocessor({
        name: name + '-preprocessor-transform',
        type: type,
        ext: ext
      }));

      name = name + '-nested';
      nestedInRepoAddons[type] = new InRepoAddonFixture(name);
      nestedInRepoAddons[type].addMethod('setupPreprocessorRegistry', generatePreprocessor({
        name: name + '-preprocessor-transform',
        type: type,
        ext: ext
      }));
    }

    var child = new InRepoAddonFixture('child-addon');

    inRepoAddons['css'].generateCSS('app/styles/app.css');
    inRepoAddons['css'].generateCSS('app/styles/addon.css');
    inRepoAddons['css'].generateCSS('app/styles/_import.css');
    inRepoAddons['css'].generateCSS('app/styles/' + inRepoAddons['css'].name + '.css');
    inRepoAddons['css'].generateCSS('app/styles/alpha.css');
    inRepoAddons['css'].generateCSS('app/styles/zeta.css');
    inRepoAddons['css'].generateCSS('addon/styles/addon.css');
    inRepoAddons['css'].generateCSS('addon/styles/app.css');
    inRepoAddons['css'].generateCSS('addon/styles/_import.css');
    inRepoAddons['css'].generateCSS('addon/styles/' + inRepoAddons['css'].name + '.css');
    inRepoAddons['css'].generateCSS('addon/styles/alpha.css');
    inRepoAddons['css'].generateCSS('addon/styles/zeta.css');

    inRepoAddons['js']._npmAddonInstall({ name: 'ember-cli-babel' });
    inRepoAddons['js'].generateJS('app/routes/hat.js');
    inRepoAddons['js'].generateJS('app/routes/cat.js');
    inRepoAddons['js'].generateJS('addon/components/thing-one.js');
    inRepoAddons['js'].generateJS('addon/components/thing-two.js');

    inRepoAddons['template']._npmAddonInstall({ name: 'ember-cli-htmlbars' });
    inRepoAddons['template'].generateTemplate('app/templates/hoist.hbs');
    inRepoAddons['template'].generateTemplate('addon/templates/anchor.hbs');

    nestedInRepoAddons['css'].generateCSS('app/styles/app.css');
    nestedInRepoAddons['css'].generateCSS('app/styles/addon.css');
    nestedInRepoAddons['css'].generateCSS('app/styles/_import.css');
    nestedInRepoAddons['css'].generateCSS('app/styles/' + nestedInRepoAddons['css'].name + '.css');
    nestedInRepoAddons['css'].generateCSS('app/styles/alpha.css');
    nestedInRepoAddons['css'].generateCSS('app/styles/zeta.css');
    nestedInRepoAddons['css'].generateCSS('addon/styles/addon.css');
    nestedInRepoAddons['css'].generateCSS('addon/styles/app.css');
    nestedInRepoAddons['css'].generateCSS('addon/styles/_import.css');
    nestedInRepoAddons['css'].generateCSS('addon/styles/' + nestedInRepoAddons['css'].name + '.css');
    nestedInRepoAddons['css'].generateCSS('addon/styles/alpha.css');
    nestedInRepoAddons['css'].generateCSS('addon/styles/zeta.css');

    nestedInRepoAddons['js']._npmAddonInstall({ name: 'ember-cli-babel' });
    nestedInRepoAddons['js'].generateJS('app/routes/hat.js');
    nestedInRepoAddons['js'].generateJS('app/routes/cat.js');
    nestedInRepoAddons['js'].generateJS('addon/components/thing-one.js');
    nestedInRepoAddons['js'].generateJS('addon/components/thing-two.js');

    nestedInRepoAddons['template']._npmAddonInstall({ name: 'ember-cli-htmlbars' });
    nestedInRepoAddons['template'].generateTemplate('app/templates/hoist.hbs');
    nestedInRepoAddons['template'].generateTemplate('addon/templates/anchor.hbs');

    root.install(child);
    root.install(inRepoAddons['css']);
    root.install(inRepoAddons['js']);
    root.install(inRepoAddons['template']);
    child.install(nestedInRepoAddons['css']);
    child.install(nestedInRepoAddons['js']);
    child.install(nestedInRepoAddons['template']);
    root.serialize();
  });

  after(function() {
    // root.clean();
  });

  beforeEach(function() {});
  afterEach(function() {});

  it('Properly invokes preprocessors.', function() {
    ember.invoke('build', { cwd: root.dir });
    "grep -r 'nested-preprocessor-transform' root_app_fixture-nphBnkY0.tmp/";
  });
});
