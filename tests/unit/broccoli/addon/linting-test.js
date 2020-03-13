'use strict';

const broccoliTestHelper = require('broccoli-test-helper');
const expect = require('chai').expect;

const MockCLI = require('../../../helpers/mock-cli');
const Project = require('../../../../lib/models/project');
const Addon = require('../../../../lib/models/addon');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;

describe('Addon - linting', function() {
  let input, output, addon, lintTrees;

  beforeEach(async function() {
    input = await createTempDir();
    let MockAddon = Addon.extend({
      name: 'first',
      root: input.path(),
    });
    lintTrees = [];
    let cli = new MockCLI();
    let pkg = { name: 'ember-app-test' };

    let project = new Project(input.path(), pkg, cli.ui, cli);
    project.addons = [
      {
        name: 'fake-linter-addon',
        lintTree(type, tree) {
          lintTrees.push(tree);
        },
      },
    ];

    addon = new MockAddon(project, project);
  });

  afterEach(async function() {
    await input.dispose();
    await output.dispose();
  });

  it('calls lintTree on project addons for app directory', async function() {
    input.write({
      app: {
        'derp.js': '// slerpy',
      },
    });

    addon.jshintAddonTree();
    expect(lintTrees.length).to.equal(1);

    output = await buildOutput(lintTrees[0]);

    expect(output.read()).to.deep.equal({
      app: {
        'derp.js': '// slerpy',
      },
    });
  });

  it('calls lintTree on project addons for addon directory', async function() {
    input.write({
      addon: {
        'derp.js': '// slerpy',
      },
    });

    addon.jshintAddonTree();
    expect(lintTrees.length).to.equal(2);

    output = await buildOutput(lintTrees[0]);

    expect(output.read()).to.deep.equal({
      addon: {
        'derp.js': '// slerpy',
      },
    });

    await output.dispose();

    output = await buildOutput(lintTrees[1]);

    expect(output.read()).to.deep.equal({
      addon: {
        templates: {},
      },
    });
  });

  it('calls lintTree on project addons for addon directory with only templates', async function() {
    input.write({
      addon: {
        templates: {
          'foo.hbs': '{{huzzzah}}',
        },
      },
    });

    addon.jshintAddonTree();
    expect(lintTrees.length).to.equal(2);

    output = await buildOutput(lintTrees[0]);

    expect(output.read()).to.deep.equal({});

    await output.dispose();

    output = await buildOutput(lintTrees[1]);

    expect(output.read()).to.deep.equal({
      addon: {
        templates: {
          'foo.hbs': '{{huzzzah}}',
        },
      },
    });
  });

  it('calls lintTree on project addons for addon directory with templates', async function() {
    input.write({
      addon: {
        'derp.js': '// slerpy',
        templates: {
          'foo.hbs': '{{huzzzah}}',
        },
      },
    });

    addon.jshintAddonTree();
    expect(lintTrees.length).to.equal(2);

    output = await buildOutput(lintTrees[0]);

    expect(output.read()).to.deep.equal({
      addon: {
        'derp.js': '// slerpy',
      },
    });

    await output.dispose();

    output = await buildOutput(lintTrees[1]);

    expect(output.read()).to.deep.equal({
      addon: {
        templates: {
          'foo.hbs': '{{huzzzah}}',
        },
      },
    });
  });

  it('calls lintTree on project addons for addon-test-support directory', async function() {
    input.write({
      'addon-test-support': {
        'derp.js': '// slerpy',
      },
    });

    addon.jshintAddonTree();
    expect(lintTrees.length).to.equal(1);

    output = await buildOutput(lintTrees[0]);

    expect(output.read()).to.deep.equal({
      'addon-test-support': {
        'derp.js': '// slerpy',
      },
    });
  });

  it('calls lintTree on project addons for test-support directory', async function() {
    input.write({
      'test-support': {
        'derp.js': '// slerpy',
      },
    });

    addon.jshintAddonTree();
    expect(lintTrees.length).to.equal(1);

    output = await buildOutput(lintTrees[0]);

    expect(output.read()).to.deep.equal({
      'test-support': {
        'derp.js': '// slerpy',
      },
    });
  });

  it('calls lintTree for trees in an addon', async function() {
    addon.project.addons[0].lintTree = function(type, tree) {
      return tree;
    };
    let addonRootContents = {
      app: {
        'app-foo.js': '// hoo-foo',
      },
      addon: {
        'addon-bar.js': '// bar-dar',
        templates: {
          'addon-templates-quux.hbs': '{{! quux-books }}',
        },
      },
      'addon-test-support': {
        'addon-test-support-baz.js': '// baz-jazz',
      },
      'test-support': {
        'test-support-qux.js': '// qux-bucks',
      },
    };
    input.write(addonRootContents);

    output = await buildOutput(addon.jshintAddonTree());
    expect(output.read()).to.deep.equal({
      first: {
        tests: addonRootContents,
      },
    });
  });
});
