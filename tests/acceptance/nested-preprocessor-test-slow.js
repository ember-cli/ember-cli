'use strict';

const path = require('path');
const fs = require('fs-extra');

const AppFixture = require('../helpers/app-fixture');
const AddonFixture = require('../helpers/addon-fixture');
const InRepoAddonFixture = require('../helpers/in-repo-addon-fixture');

const processTemplate = require('../../lib/utilities/process-template');

const root = path.resolve(__dirname, '..', '..');
const CommandGenerator = require('../../tests/helpers/command-generator');
const ember = new CommandGenerator(path.join(root, 'bin', 'ember'));

const chai = require('../chai');
const expect = chai.expect;
const file = chai.file;

// THIS IS A FIXTURE. It also happens to be valid JavaScript.
const setupPreprocessorRegistryFixture = function(selfOrParent, registry) {
  const stew = require('broccoli-stew');
  let addon = this;

  registry.add('<%= registryType %>', {
    name: `${addon.name}-<%= registryType %>`,
    ext: '<%= ext %>',
    toTree(tree) {
      return stew.map(tree, function(content, relativePath) {
        let marker = `// ${addon.name}-<%= registryType %>-preprocessor-transform-${selfOrParent} /${relativePath}`;
        addon.project.ui.writeLine(marker);
        return `${marker} \n ${content}`;
      });
    },
  });
};
function generatePreprocessor(context) {
  return processTemplate(setupPreprocessorRegistryFixture.toString(), context);
}

// THIS IS A FIXTURE. It also happens to be valid JavaScript.
const preprocessTreeFixture = function(type, tree) {
  if (type === 'all') { return tree; }

  // THIS IS A WORKAROUND FOR https://github.com/ember-cli/ember-cli/issues/6512
  if (type === 'css' && tree.toString().indexOf('Concat: Vendor Styles') !== -1) {
    return tree;
  }

  const stew = require('broccoli-stew');
  let addon = this;

  // We're going to add a marker. The `postprocessTree` function will remove
  // the marker if present and identify whether or not it found the marker.
  let marker = `// ${addon.name}-preprocessTree(${type}) /`;

  tree = stew.map(tree, function(content, relativePath) {
    let localMarker = marker + relativePath;
    addon.project.ui.writeLine(localMarker);
    return `${localMarker} \n ${content}`;
  });

  return tree;
};

// THIS IS A FIXTURE. It also happens to be valid JavaScript.
const postprocessTreeFixture = function(type, tree) {
  if (type === 'all') { return tree; }

  const stew = require('broccoli-stew');
  let addon = this;

  let preprocessTreeMarker = `// ${addon.name}-preprocessTree(${type})`;
  let marker = `// ${addon.name}-postprocessTree(${type})`;

  // We're going to inspect state and add an appropriate marker.
  tree = stew.map(tree, function(content, relativePath) {

    // Skip assets we know that the CSS preprocessor adds.
    let cssName = addon._findHost().name;
    if (type === 'css') {
      if (relativePath === `assets/${cssName}.css` || relativePath === 'assets/vendor.css') {
        return content;
      }
    }

    // Build up the path for where the asset was previously.
    let preprocessPath = relativePath;

    if (type === 'template') {
      preprocessPath = preprocessPath.replace(/.js$/, '.hbs');
    } else if (type === 'css') {
      preprocessPath = preprocessPath.replace(/^assets/, 'app/styles');
    }

    let localPreprocessTreeMarker = `${preprocessTreeMarker} /${preprocessPath}`;
    let preprocessTreeMarkerIndex = content.indexOf(localPreprocessTreeMarker);
    let preprocessTreeMarkerLastIndex = content.lastIndexOf(localPreprocessTreeMarker);

    let localMarker = marker;

    if (preprocessTreeMarkerIndex === -1) {
      localMarker = `${localMarker}-no-preprocessTree /${relativePath}`;
      addon.project.ui.writeLine(localMarker);
      return `${localMarker}\n${content}`;
    } else {
      localMarker = `${localMarker}-removed-preprocessTree /${relativePath}`;
      addon.project.ui.writeLine(localMarker);
      return content.replace(localPreprocessTreeMarker, localMarker);
    }
  });

  return tree;
};

describe('Acceptance: nested preprocessor tests.', function() {
  this.timeout(1000 * 60 * 10);
  let root;

  before(function() {
    root = new AppFixture('root');

    root.fixture['ember-cli-build.js'] = root.fixture['ember-cli-build.js'].replace('// Add options here', 'hinting: false');

    const types = ['js', 'css', 'template'];
    const extensions = ['js', 'css', 'hbs'];

    let name, type, ext;
    let inRepoAddons = {};
    let nestedInRepoAddons = {};
    for (let i = 0; i < types.length; i++) {
      type = types[i];
      ext = extensions[i];
      name = `${type}-addon`;

      inRepoAddons[type] = new InRepoAddonFixture(name);
      inRepoAddons[type].addMethod('preprocessTree', preprocessTreeFixture.toString());
      inRepoAddons[type].addMethod('postprocessTree', postprocessTreeFixture.toString());
      if (type !== 'css') {
        inRepoAddons[type].addMethod('setupPreprocessorRegistry', generatePreprocessor({
          registryType: type,
          ext,
        }));
      }

      name = `${name}-nested`;
      nestedInRepoAddons[type] = new InRepoAddonFixture(name);
      nestedInRepoAddons[type].addMethod('preprocessTree', preprocessTreeFixture.toString());
      nestedInRepoAddons[type].addMethod('postprocessTree', postprocessTreeFixture.toString());
      if (type !== 'css') {
        nestedInRepoAddons[type].addMethod('setupPreprocessorRegistry', generatePreprocessor({
          registryType: type,
          ext,
        }));
      }
    }

    let child = new InRepoAddonFixture('child-addon');
    child.installNodeModule('dependencies', 'ember-cli-htmlbars');
    child.generateCSS(`addon/styles/${child.name}.css`);
    child.generateJS('addon/components/thing-one.js');
    child.generateTemplate('addon/templates/anchor.hbs');

    inRepoAddons['css'].generateCSS('app/styles/app.css');
    inRepoAddons['css'].generateCSS('app/styles/addon.css');
    inRepoAddons['css'].generateCSS('app/styles/_import.css');
    inRepoAddons['css'].generateCSS(`app/styles/${inRepoAddons['css'].name}.css`);
    inRepoAddons['css'].generateCSS('app/styles/alpha.css');
    inRepoAddons['css'].generateCSS('app/styles/zeta.css');
    inRepoAddons['css'].generateCSS('addon/styles/addon.css');
    inRepoAddons['css'].generateCSS('addon/styles/app.css');
    inRepoAddons['css'].generateCSS('addon/styles/_import.css');
    inRepoAddons['css'].generateCSS(`addon/styles/${inRepoAddons['css'].name}.css`);
    inRepoAddons['css'].generateCSS('addon/styles/alpha.css');
    inRepoAddons['css'].generateCSS('addon/styles/zeta.css');

    inRepoAddons['js'].installNodeModule('dependencies', 'ember-cli-babel');
    inRepoAddons['js'].generateJS('app/routes/hat.js');
    inRepoAddons['js'].generateJS('app/routes/cat.js');
    inRepoAddons['js'].generateJS('addon/components/thing-one.js');
    inRepoAddons['js'].generateJS('addon/components/thing-two.js');

    inRepoAddons['template'].installNodeModule('dependencies', 'ember-cli-htmlbars');
    inRepoAddons['template'].generateTemplate('app/templates/hoist.hbs');
    inRepoAddons['template'].generateTemplate('addon/templates/anchor.hbs');

    nestedInRepoAddons['css'].generateCSS('app/styles/app.css');
    nestedInRepoAddons['css'].generateCSS('app/styles/addon.css');
    nestedInRepoAddons['css'].generateCSS('app/styles/_import.css');
    nestedInRepoAddons['css'].generateCSS(`app/styles/${nestedInRepoAddons['css'].name}.css`);
    nestedInRepoAddons['css'].generateCSS('app/styles/alpha.css');
    nestedInRepoAddons['css'].generateCSS('app/styles/zeta.css');
    nestedInRepoAddons['css'].generateCSS('addon/styles/addon.css');
    nestedInRepoAddons['css'].generateCSS('addon/styles/app.css');
    nestedInRepoAddons['css'].generateCSS('addon/styles/_import.css');
    nestedInRepoAddons['css'].generateCSS(`addon/styles/${nestedInRepoAddons['css'].name}.css`);
    nestedInRepoAddons['css'].generateCSS('addon/styles/alpha.css');
    nestedInRepoAddons['css'].generateCSS('addon/styles/zeta.css');

    nestedInRepoAddons['js'].installNodeModule('dependencies', 'ember-cli-babel');
    nestedInRepoAddons['js'].generateJS('app/routes/hat.js');
    nestedInRepoAddons['js'].generateJS('app/routes/cat.js');
    nestedInRepoAddons['js'].generateJS('addon/components/thing-one.js');
    nestedInRepoAddons['js'].generateJS('addon/components/thing-two.js');

    nestedInRepoAddons['template'].installNodeModule('dependencies', 'ember-cli-htmlbars');
    nestedInRepoAddons['template'].generateTemplate('app/templates/nested-hoist.hbs');
    nestedInRepoAddons['template'].generateTemplate('addon/templates/nested-anchor.hbs');

    root.installAddonFixture(child);
    root.installAddonFixture(inRepoAddons['css']);
    root.installAddonFixture(inRepoAddons['js']);
    root.installAddonFixture(inRepoAddons['template']);
    child.installAddonFixture(nestedInRepoAddons['css']);
    child.installAddonFixture(nestedInRepoAddons['js']);
    child.installAddonFixture(nestedInRepoAddons['template']);
    root.serialize();
  });

  after(function() {
    root.clean();
  });

  it('Invokes hooks in correct order.', function() {
    let result = ember.invoke('build', { cwd: root.dir });
    expect(result.stdout).to.not.contain('no-preprocessTree');

    let uniques = result.stdout.split('\n')
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

    let expected = [
      'js-addon-nested-js-preprocessor-transform-self',
      'template-addon-nested-template-preprocessor-transform-self',
      'css-addon-nested-preprocessTree(js)',
      'js-addon-nested-preprocessTree(js)',
      'template-addon-nested-preprocessTree(js)',
      'js-addon-nested-js-preprocessor-transform-parent',
      'css-addon-nested-postprocessTree(js)-removed-preprocessTree',
      'js-addon-nested-postprocessTree(js)-removed-preprocessTree',
      'template-addon-nested-postprocessTree(js)-removed-preprocessTree',
      'css-addon-nested-preprocessTree(template)',
      'js-addon-nested-preprocessTree(template)',
      'template-addon-nested-preprocessTree(template)',
      'template-addon-nested-template-preprocessor-transform-parent',
      'css-addon-nested-postprocessTree(template)-removed-preprocessTree',
      'js-addon-nested-postprocessTree(template)-removed-preprocessTree',
      'template-addon-nested-postprocessTree(template)-removed-preprocessTree',
      'css-addon-nested-preprocessTree(css)',
      'js-addon-nested-preprocessTree(css)',
      'template-addon-nested-preprocessTree(css)',
      'css-addon-nested-postprocessTree(css)-removed-preprocessTree',
      'js-addon-nested-postprocessTree(css)-removed-preprocessTree',
      'template-addon-nested-postprocessTree(css)-removed-preprocessTree',
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
      'template-addon-postprocessTree(test)-removed-preprocessTree',
    ];

    expect(uniques).to.deep.equal(expected);
  });

  it('Properly invokes preprocessors.', function() {

    // APP
    let appJSPath = path.join(root.dir, 'dist', 'assets', `${root.name}.js`);
    let appJS = fs.readFileSync(appJSPath, { encoding: 'utf8' });

    // `define` count and preprocessor invocation count should be almost identical.
    // This is because all but the config module are included as individual files.
    let moduleCount = appJS.split('define(').length;
    let jsPreprocessorCount = appJS.split('js-addon-js-preprocessor-transform-parent').length;
    expect(moduleCount - 1).to.equal(jsPreprocessorCount);

    // There should be no `js` `self` preprocessor transforms.
    // All modules in this file have been "moved" into the app tree.
    expect(appJS.indexOf('js-addon-js-preprocessor-transform-self')).to.equal(-1);

    // We have two hoisted templates and the application template.
    let templatePreprocessorCount = appJS.split('template-addon-template-preprocessor-transform-parent').length - 1;
    expect(templatePreprocessorCount).to.equal(3);

    // There should be no `template` `self` preprocessor transforms.
    expect(appJS.indexOf('template-addon-template-preprocessor-transform-self')).to.equal(-1);


    // VENDOR
    let vendorJSPath = path.join(root.dir, 'dist', 'assets', 'vendor.js');
    let vendorJS = fs.readFileSync(vendorJSPath, { encoding: 'utf8' });

    // We have two components each in two addons.
    let vendorJSPreprocessorSelfCount = vendorJS.split('js-preprocessor-transform-self').length - 1;
    expect(vendorJSPreprocessorSelfCount).to.equal(4);

    // We have two non-hoisted templates.
    let vendorTemplatePreprocessorSelfCount = vendorJS.split('template-preprocessor-transform-self').length - 1;
    expect(vendorTemplatePreprocessorSelfCount).to.equal(2);

    // There should be one `js` `parent` preprocessor transform (from nested to child-addon).
    let vendorJSPreprocessorParentCount = vendorJS.split('js-preprocessor-transform-parent').length - 1;
    expect(vendorJSPreprocessorParentCount).to.equal(1);

    // There should be one `template` `parent` preprocessor transforms (from nested to child-addon).
    let vendorTemplatePreprocessorParentCount = vendorJS.split('js-preprocessor-transform-parent').length - 1;
    expect(vendorTemplatePreprocessorParentCount).to.equal(1);


    // TEST
    let testJSPath = path.join(root.dir, 'dist', 'assets', 'tests.js');
    let testJS = fs.readFileSync(testJSPath, { encoding: 'utf8' });

    // `define` count and preprocessor invocation count should be identical.
    let testModuleCount = testJS.split('define(').length;
    let testJSPreprocessorCount = testJS.split('js-addon-js-preprocessor-transform-parent').length;
    expect(testModuleCount).to.equal(testJSPreprocessorCount);

  });

});
