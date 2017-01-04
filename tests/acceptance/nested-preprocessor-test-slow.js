'use strict';

var path = require('path');
var fs = require('fs-extra');

var AppFixture = require('../helpers/app-fixture');
var AddonFixture = require('../helpers/addon-fixture');
var InRepoAddonFixture = require('../helpers/in-repo-addon-fixture');

var processTemplate = require('../../lib/utilities/process-template');

var root = path.resolve(__dirname, '..', '..');
var CommandGenerator = require('../../tests/helpers/command-generator');
var ember = new CommandGenerator(path.join(root, 'bin', 'ember'));

var chai = require('../chai');
var expect = chai.expect;
var file = chai.file;

// THIS IS A FIXTURE. It also happens to be valid JavaScript.
var setupPreprocessorRegistryFixture = function(selfOrParent, registry) {
  var stew = require('broccoli-stew');
  var addon = this;

  registry.add('<%= registryType %>', {
    name: addon.name + '-<%= registryType %>',
    ext: '<%= ext %>',
    toTree: function(tree) {
      return stew.map(tree, function(content, relativePath) {
        var marker = '// ' + addon.name + '-<%= registryType %>-preprocessor-transform-' + selfOrParent + ' /' + relativePath;
        addon.project.ui.writeLine(marker);
        return marker + '\n' + content;
      });
    }
  });
};
function generatePreprocessor(context) {
  return processTemplate(setupPreprocessorRegistryFixture.toString(), context);
}

// THIS IS A FIXTURE. It also happens to be valid JavaScript.
var preprocessTreeFixture = function(type, tree) {
  if (type === 'all') { return tree; }

  // THIS IS A WORKAROUND FOR https://github.com/ember-cli/ember-cli/issues/6512
  if (type === 'css' && tree.toString().indexOf('Concat: Vendor Styles') !== -1) {
    return tree;
  }

  var stew = require('broccoli-stew');
  var addon = this;

  // We're going to add a marker. The `postprocessTree` function will remove
  // the marker if present and identify whether or not it found the marker.
  var marker = '// ' + addon.name + '-preprocessTree(' + type + ')' + ' /';

  tree = stew.map(tree, function(content, relativePath) {
    var localMarker = marker + relativePath;
    addon.project.ui.writeLine(localMarker);
    return localMarker + '\n' + content;
  });

  return tree;
};

// THIS IS A FIXTURE. It also happens to be valid JavaScript.
var postprocessTreeFixture = function(type, tree) {
  if (type === 'all') { return tree; }

  var stew = require('broccoli-stew');
  var addon = this;

  var preprocessTreeMarker = '// ' + addon.name + '-preprocessTree(' + type + ')';
  var marker = '// ' + addon.name + '-postprocessTree(' + type + ')';

  // We're going to inspect state and add an appropriate marker.
  tree = stew.map(tree, function(content, relativePath) {

    // Skip assets we know that the CSS preprocessor adds.
    var cssName = addon._findHost().name;
    if (type === 'css') {
      if (relativePath === 'assets/' + cssName + '.css' || relativePath === 'assets/vendor.css') {
        return content;
      }
    }

    // Build up the path for where the asset was previously.
    var preprocessPath = relativePath;

    if (type === 'template') {
      preprocessPath = preprocessPath.replace(/.js$/, '.hbs');
    } else if (type === 'css') {
      preprocessPath = preprocessPath.replace(/^assets/, 'app/styles');
    }

    var localPreprocessTreeMarker = preprocessTreeMarker + ' /' + preprocessPath;
    var preprocessTreeMarkerIndex = content.indexOf(localPreprocessTreeMarker);
    var preprocessTreeMarkerLastIndex = content.lastIndexOf(localPreprocessTreeMarker);

    var localMarker = marker;

    if (preprocessTreeMarkerIndex === -1) {
      localMarker += '-no-preprocessTree';
      localMarker += ' /' + relativePath;
      addon.project.ui.writeLine(localMarker);
      return localMarker + '\n' + content;
    } else {
      localMarker += '-removed-preprocessTree';
      localMarker += ' /' + relativePath;
      addon.project.ui.writeLine(localMarker);
      return content.replace(localPreprocessTreeMarker, localMarker);
    }
  });

  return tree;
};

describe('Acceptance: nested preprocessor tests.', function() {
  this.timeout(1000 * 60 * 10);
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
      inRepoAddons[type].addMethod('preprocessTree', preprocessTreeFixture.toString());
      inRepoAddons[type].addMethod('postprocessTree', postprocessTreeFixture.toString());
      if (type !== 'css') {
        inRepoAddons[type].addMethod('setupPreprocessorRegistry', generatePreprocessor({
          registryType: type,
          ext: ext
        }));
      }

      name = name + '-nested';
      nestedInRepoAddons[type] = new InRepoAddonFixture(name);
      nestedInRepoAddons[type].addMethod('preprocessTree', preprocessTreeFixture.toString());
      nestedInRepoAddons[type].addMethod('postprocessTree', postprocessTreeFixture.toString());
      if (type !== 'css') {
        nestedInRepoAddons[type].addMethod('setupPreprocessorRegistry', generatePreprocessor({
          registryType: type,
          ext: ext
        }));
      }
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
    nestedInRepoAddons['template'].generateTemplate('app/templates/nested-hoist.hbs');
    nestedInRepoAddons['template'].generateTemplate('addon/templates/nested-anchor.hbs');

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
    root.clean();
  });

  it('Invokes hooks in correct order.', function() {
    var result = ember.invoke('build', { cwd: root.dir });
    expect(result.stdout).to.not.contain('no-preprocessTree');

    var uniques = result.stdout.split('\n')
      .map(function(log) {
        return log.split(' ')[1];
      })
      .reduce(function(accumulator, log) {
        // Remove spurious output.
        if (!log) { return accumulator; }
        if (log.indexOf('process') === -1) { return accumulator; }

        // Compare to previous value, collapse.
        if (accumulator[accumulator.length - 1] !== log) {
          accumulator.push(log);
        }

        return accumulator;
      }, []);

    var expected = [
      'js-addon-nested-js-preprocessor-transform-self',
      'template-addon-nested-template-preprocessor-transform-self',
      'js-addon-js-preprocessor-transform-self',
      'template-addon-template-preprocessor-transform-self',
      'css-addon-preprocessTree(template)',
      'js-addon-preprocessTree(template)',
      'template-addon-preprocessTree(template)',
      'template-addon-template-preprocessor-transform-parent',
      'css-addon-postprocessTree(template)-removed-preprocessTree',
      'js-addon-postprocessTree(template)-removed-preprocessTree',
      'template-addon-postprocessTree(template)-removed-preprocessTree',
      'css-addon-preprocessTree(js)',
      'js-addon-preprocessTree(js)',
      'template-addon-preprocessTree(js)',
      'js-addon-js-preprocessor-transform-parent',
      'css-addon-postprocessTree(js)-removed-preprocessTree',
      'js-addon-postprocessTree(js)-removed-preprocessTree',
      'template-addon-postprocessTree(js)-removed-preprocessTree',
      'css-addon-preprocessTree(css)',
      'js-addon-preprocessTree(css)',
      'template-addon-preprocessTree(css)',
      'css-addon-postprocessTree(css)-removed-preprocessTree',
      'js-addon-postprocessTree(css)-removed-preprocessTree',
      'template-addon-postprocessTree(css)-removed-preprocessTree',
      'css-addon-preprocessTree(test)',
      'js-addon-preprocessTree(test)',
      'template-addon-preprocessTree(test)',
      'js-addon-js-preprocessor-transform-parent',
      'css-addon-postprocessTree(test)-removed-preprocessTree',
      'js-addon-postprocessTree(test)-removed-preprocessTree',
      'template-addon-postprocessTree(test)-removed-preprocessTree'
    ];

    expect(uniques).to.deep.equal(expected);
  });

  it('Properly invokes preprocessors.', function() {

    // APP
    var appJSPath = path.join(root.dir, 'dist', 'assets', root.name + '.js');
    var appJS = fs.readFileSync(appJSPath, { encoding: 'utf8' });

    // `define` count and preprocessor invocation count should be almost identical.
    // This is because all but the config module are included as individual files.
    var moduleCount = appJS.split('define(').length;
    var jsPreprocessorCount = appJS.split('js-addon-js-preprocessor-transform-parent').length;
    expect(moduleCount - 1).to.equal(jsPreprocessorCount);

    // There should be no `js` `self` preprocessor transforms.
    // All modules in this file have been "moved" into the app tree.
    expect(appJS.indexOf('js-addon-js-preprocessor-transform-self')).to.equal(-1);

    // We have two hoisted templates and the application template.
    var templatePreprocessorCount = appJS.split('template-addon-template-preprocessor-transform-parent').length - 1;
    expect(templatePreprocessorCount).to.equal(3);

    // There should be no `template` `self` preprocessor transforms.
    expect(appJS.indexOf('template-addon-template-preprocessor-transform-self')).to.equal(-1);


    // VENDOR
    var vendorJSPath = path.join(root.dir, 'dist', 'assets', 'vendor.js');
    var vendorJS = fs.readFileSync(vendorJSPath, { encoding: 'utf8' });

    // We have two components each in two addons.
    var vendorJSPreprocessorCount = vendorJS.split('js-preprocessor-transform-self').length - 1;
    expect(vendorJSPreprocessorCount).to.equal(4);

    // We have two non-hoisted templates.
    var vendorTemplatePreprocessorCount = vendorJS.split('template-preprocessor-transform-self').length - 1;
    expect(vendorTemplatePreprocessorCount).to.equal(2);

    // There should be no `js` `parent` preprocessor transforms.
    expect(vendorJS.indexOf('js-preprocessor-transform-parent')).to.equal(-1);

    // There should be no `template` `parent` preprocessor transforms.
    expect(vendorJS.indexOf('template-preprocessor-transform-parent')).to.equal(-1);


    // TEST
    var testJSPath = path.join(root.dir, 'dist', 'assets', 'tests.js');
    var testJS = fs.readFileSync(testJSPath, { encoding: 'utf8' });

    // `define` count and preprocessor invocation count should be identical.
    var testModuleCount = testJS.split('define(').length;
    var testJSPreprocessorCount = testJS.split('js-addon-js-preprocessor-transform-parent').length;
    expect(testModuleCount).to.equal(testJSPreprocessorCount);

  });

});
