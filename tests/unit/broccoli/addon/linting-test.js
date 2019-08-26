'use strict';

const co = require('co');
const broccoliTestHelper = require('broccoli-test-helper');
const expect = require('chai').expect;

const MockCLI = require('../../../helpers/mock-cli');
const Project = require('../../../../lib/models/project');
const Addon = require('../../../../lib/models/addon');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;

describe('Addon - linting', function() {
  let input, output, addon, lintTrees;

  beforeEach(
    co.wrap(function*() {
      input = yield createTempDir();
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
    })
  );

  afterEach(
    co.wrap(function*() {
      yield input.dispose();
      yield output.dispose();
    })
  );

  it(
    'calls lintTree on project addons for app directory',
    co.wrap(function*() {
      input.write({
        app: {
          'derp.js': '// slerpy',
        },
      });

      addon.jshintAddonTree();
      expect(lintTrees.length).to.equal(1);

      output = yield buildOutput(lintTrees[0]);

      expect(output.read()).to.deep.equal({
        app: {
          'derp.js': '// slerpy',
        },
      });
    })
  );

  it(
    'calls lintTree on project addons for addon directory',
    co.wrap(function*() {
      input.write({
        addon: {
          'derp.js': '// slerpy',
        },
      });

      addon.jshintAddonTree();
      expect(lintTrees.length).to.equal(2);

      let firstOutput = yield buildOutput(lintTrees[0]);

      try {
        expect(firstOutput.read()).to.deep.equal({
          addon: {
            'derp.js': '// slerpy',
          },
        });
      } finally {
        yield firstOutput.dispose();
      }

      let secondOutput = yield buildOutput(lintTrees[1]);

      try {
        expect(secondOutput.read()).to.deep.equal({
          addon: {
            templates: {},
          },
        });
      } finally {
        yield secondOutput.dispose();
      }
    })
  );

  it(
    'calls lintTree on project addons for addon directory with only templates',
    co.wrap(function*() {
      input.write({
        addon: {
          templates: {
            'foo.hbs': '{{huzzzah}}',
          },
        },
      });

      addon.jshintAddonTree();
      expect(lintTrees.length).to.equal(2);

      let firstOutput = yield buildOutput(lintTrees[0]);

      try {
        expect(firstOutput.read()).to.deep.equal({});
      } finally {
        yield firstOutput.dispose();
      }

      let secondOutput = yield buildOutput(lintTrees[1]);

      try {
        expect(output.read()).to.deep.equal({
          addon: {
            templates: {
              'foo.hbs': '{{huzzzah}}',
            },
          },
        });
      } finally {
        yield secondOutput.dispose();
      }
    })
  );

  it(
    'calls lintTree on project addons for addon directory with templates',
    co.wrap(function*() {
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

      let firstOutput = yield buildOutput(lintTrees[0]);

      try {
        expect(firstOutput.read()).to.deep.equal({
          addon: {
            'derp.js': '// slerpy',
          },
        });
      } finally {
        yield firstOutput.dispose();
      }

      let secondOutput = yield buildOutput(lintTrees[1]);

      try {
        expect(secondOutput.read()).to.deep.equal({
          addon: {
            templates: {
              'foo.hbs': '{{huzzzah}}',
            },
          },
        });
      } finally {
        yield secondOutput.dispose();
      }
    })
  );

  it(
    'calls lintTree on project addons for addon-test-support directory',
    co.wrap(function*() {
      input.write({
        'addon-test-support': {
          'derp.js': '// slerpy',
        },
      });

      addon.jshintAddonTree();
      expect(lintTrees.length).to.equal(1);

      output = yield buildOutput(lintTrees[0]);

      expect(output.read()).to.deep.equal({
        'addon-test-support': {
          'derp.js': '// slerpy',
        },
      });
    })
  );

  it(
    'calls lintTree on project addons for test-support directory',
    co.wrap(function*() {
      input.write({
        'test-support': {
          'derp.js': '// slerpy',
        },
      });

      addon.jshintAddonTree();
      expect(lintTrees.length).to.equal(1);

      output = yield buildOutput(lintTrees[0]);

      expect(output.read()).to.deep.equal({
        'test-support': {
          'derp.js': '// slerpy',
        },
      });
    })
  );

  it(
    'calls lintTree for trees in an addon',
    co.wrap(function*() {
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

      output = yield buildOutput(addon.jshintAddonTree());
      expect(output.read()).to.deep.equal({
        first: {
          tests: addonRootContents,
        },
      });
    })
  );
});
