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
}

// THIS IS A FIXTURE. It also happens to be valid JavaScript.
const treeForVendorFixture = function(tree) {
  tree = this._super.treeForVendor(tree);
  const Funnel = require('broccoli-funnel');
  const MergeTrees = require('broccoli-merge-trees');

  let addedAssets = new Funnel('funnel', { srcDir: 'funnel' });
  return new MergeTrees([tree, addedAssets], { overwrite: true });
}

describe('Acceptance: Loose module concat.', function() {
  this.timeout(1000 * 60 * 10);
  let root;

  before(function() {
    root = new AppFixture('root');

    let child = new InRepoAddonFixture('child-addon');
    child._npmAddonInstall({ name: 'ember-cli-htmlbars' });
    child._npmAddonInstall({ name: 'ember-cli-babel' });
    child.generateCSS(`addon/styles/${child.name}.css`);
    child.generateJS('addon/components/thing-one.js');
    child.generateTemplate('addon/templates/anchor.hbs');

    // And some trolling:
    child.generateCSS(`funnel/${child.name}.css`);
    child.generateCSS(`funnel/vendor.css`);
    child.generateCSS(`funnel/app.css`);
    child.generateCSS(`funnel/addon.css`);


    let grandchild = new InRepoAddonFixture('grandchild-addon');
    grandchild.generateCSS(`addon/styles/${grandchild.name}.css`);
    grandchild.generateJS('addon/components/thing-one.js');
    grandchild.generateTemplate('addon/templates/anchor.hbs');


    root.install(child);
    child.install(grandchild);
    root.serialize();
  });

  after(function() {
    root.clean();
  });

  it('Generates the correct output given complicated addon structure.', function() {
    let result = ember.invoke('build', { cwd: root.dir });

    // APP
    let appJSPath = path.join(root.dir, 'dist', 'assets', `${root.name}.js`);
    let appJS = fs.readFileSync(appJSPath, { encoding: 'utf8' });
    expect(appJS.indexOf('child thing-one.js')).to.not.equal(-1);


    // VENDOR
    let vendorCSSPath = path.join(root.dir, 'dist', 'assets', 'vendor.css');
    let vendorCSS = fs.readFileSync(vendorCSSPath, { encoding: 'utf8' });
    expect(vendorCSS.indexOf('addon/styles/child-addon.css')).to.not.equal(-1);
    expect(vendorCSS.indexOf('addon/styles/grandchild-addon.css')).to.not.equal(-1);

  });

});
