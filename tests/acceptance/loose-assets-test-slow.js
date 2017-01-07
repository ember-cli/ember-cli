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
const treeForAddonFixture = function(tree) {
  tree = this._super.treeForAddon(tree);
  const Funnel = require('broccoli-funnel');
  const MergeTrees = require('broccoli-merge-trees');

  let addedAssets = new Funnel('funnel', { srcDir: 'funnel' });
  return new MergeTrees([tree, addedAssets], { overwrite: true });
};

// THIS IS A FIXTURE. It also happens to be valid JavaScript.
const treeForVendorFixture = function(tree) {
  tree = this._super.treeForVendor(tree);
  const Funnel = require('broccoli-funnel');
  const MergeTrees = require('broccoli-merge-trees');

  let addedAssets = new Funnel('funnel', { srcDir: 'funnel' });
  return new MergeTrees([tree, addedAssets], { overwrite: true });
};

const includedFixture = function(parent) {
  this.import('foo/bar');
};

describe('Acceptance: Loose module concat.', function() {
  this.timeout(1000 * 60 * 10);
  let root;

  before(function() {
    root = new AppFixture('root');

    let child = new InRepoAddonFixture('child-addon');
    child._npmAddonInstall({ name: 'ember-cli-htmlbars' });
    child._npmAddonInstall({ name: 'ember-cli-babel' });
    // child.addMethod('included', includedFixture.toString());

    child.generateCSS('app/styles/app.css');
    child.generateCSS('app/styles/addon.css');
    child.generateCSS('app/styles/_import.css');
    child.generateCSS(`app/styles/${child.name}.css`);
    child.generateCSS('app/styles/alpha.css');
    child.generateCSS('app/styles/zeta.css');
    child.generateCSS('addon/styles/addon.css');
    child.generateCSS('addon/styles/app.css');
    child.generateCSS('addon/styles/_import.css');
    child.generateCSS(`addon/styles/${child.name}.css`);
    child.generateCSS('addon/styles/alpha.css');
    child.generateCSS('addon/styles/zeta.css');
    child.generateJS('addon/components/thing-one.js');
    child.generateTemplate('addon/templates/anchor.hbs');

    // And some trolling:
    child.generateFile(`funnel/${child.name}.css`, `funnel/${child.name}.css`);
    child.generateFile('funnel/vendor.css', 'child/funnel/vendor.css');
    child.generateFile('funnel/app.css', 'child/funnel/app.css');
    child.generateFile('funnel/addon.css', 'child/funnel/addon.css');

    let grandchild = new InRepoAddonFixture('grandchild-addon');
    grandchild._npmAddonInstall({ name: 'ember-cli-htmlbars' });
    grandchild._npmAddonInstall({ name: 'ember-cli-babel' });
    // grandchild.addMethod('included', includedFixture.toString());

    grandchild.generateCSS('app/styles/app.css');
    grandchild.generateCSS('app/styles/addon.css');
    grandchild.generateCSS('app/styles/_import.css');
    grandchild.generateCSS(`app/styles/${grandchild.name}.css`);
    grandchild.generateCSS('app/styles/alpha.css');
    grandchild.generateCSS('app/styles/zeta.css');
    grandchild.generateCSS('addon/styles/addon.css');
    grandchild.generateCSS('addon/styles/app.css');
    grandchild.generateCSS('addon/styles/_import.css');
    grandchild.generateCSS(`addon/styles/${grandchild.name}.css`);
    grandchild.generateCSS('addon/styles/alpha.css');
    grandchild.generateCSS('addon/styles/zeta.css');
    grandchild.generateJS('addon/components/thing-one.js');
    grandchild.generateTemplate('addon/templates/anchor.hbs');

    // And some trolling:
    grandchild.generateFile(`funnel/${grandchild.name}.css`, `funnel/${grandchild.name}.css`);
    grandchild.generateFile('funnel/vendor.css', 'grandchild/funnel/vendor.css');
    grandchild.generateFile('funnel/app.css', 'grandchild/funnel/app.css');
    grandchild.generateFile('funnel/addon.css', 'grandchild/funnel/addon.css');

    root.install(child);
    child.install(grandchild);
    root.serialize();
  });

  after(function() {
    root.clean();
  });

  it('Generates the correct output given a complicated addon structure.', function() {
    let result = ember.invoke('build', { cwd: root.dir });

    // APP
    let appJSPath = path.join(root.dir, 'dist', 'assets', `${root.name}.js`);
    let appJS = fs.readFileSync(appJSPath, { encoding: 'utf8' });
    // expect(appJS.indexOf('child thing-one.js')).to.not.equal(-1);

    let appCSSPath = path.join(root.dir, 'dist', 'assets', `${root.name}.css`);
    let appCSS = fs.readFileSync(appCSSPath, { encoding: 'utf8' });
    // expect(appCSS.indexOf('child thing-one.js')).to.not.equal(-1);


    // VENDOR
    let vendorCSSPath = path.join(root.dir, 'dist', 'assets', 'vendor.css');
    let vendorCSS = fs.readFileSync(vendorCSSPath, { encoding: 'utf8' });

    let expected = [
      '.child-addon { content: "addon/styles/_import.css"; }',
      '.child-addon { content: "addon/styles/alpha.css"; }',
      '.child-addon { content: "addon/styles/app.css"; }',
      '.child-addon { content: "addon/styles/child-addon.css"; }',
      '.grandchild-addon { content: "addon/styles/grandchild-addon.css"; }',

      // These are included via vendor.css. (Note alpha position.)
      '.child-addon { content: "addon/styles/_import.css"; }',
      '.child-addon { content: "addon/styles/addon.css"; }',
      '.child-addon { content: "addon/styles/alpha.css"; }',
      '.child-addon { content: "addon/styles/app.css"; }',
      '.child-addon { content: "addon/styles/child-addon.css"; }',
      '.child-addon { content: "addon/styles/zeta.css"; }',
      '.grandchild-addon { content: "addon/styles/_import.css"; }',
      '.grandchild-addon { content: "addon/styles/addon.css"; }',
      '.grandchild-addon { content: "addon/styles/alpha.css"; }',
      '.grandchild-addon { content: "addon/styles/app.css"; }',
      '.grandchild-addon { content: "addon/styles/grandchild-addon.css"; }',
      '.grandchild-addon { content: "addon/styles/zeta.css"; }',
      // End included via vendor.css.

      '.child-addon { content: "addon/styles/zeta.css"; }',
    ];

    expect(vendorCSS.indexOf(expected.join('\n'))).to.not.equal(-1);

  });

});
