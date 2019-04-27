'use strict';

const co = require('co');
const path = require('path');
const broccoliTestHelper = require('broccoli-test-helper');
const expect = require('chai').expect;

const MockCLI = require('../../../helpers/mock-cli');
const Project = require('../../../../lib/models/project');
const Addon = require('../../../../lib/models/addon');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;

describe('Addon - moduleName', function() {
  let input, output, addon;

  beforeEach(
    co.wrap(function*() {
      input = yield createTempDir();
      let MockAddon = Addon.extend({
        root: input.path(),
        name: 'fake-addon',
        moduleName() {
          return 'totes-not-fake-addon';
        },
      });
      let cli = new MockCLI();
      let pkg = { name: 'ember-app-test' };
      let project = new Project(input.path(), pkg, cli.ui, cli);

      addon = new MockAddon(project, project);

      // override the registry so it just returns the input for everything
      // and doesn't whine about not finding template preprocessors
      addon.registry.load = () => [
        {
          toTree(t) {
            return t;
          },
        },
      ];
    })
  );

  afterEach(
    co.wrap(function*() {
      yield input.dispose();
      yield output.dispose();
    })
  );

  it(
    'uses the module name function',
    co.wrap(function*() {
      input.write({
        addon: {
          'herp.js': '// slerpy',
          templates: {
            'derp.hbs': '<!-- flerpy -->',
          },
        },
      });

      output = yield buildOutput(addon.treeForAddon(path.join(addon.root, '/addon')));

      expect(output.read()).to.deep.equal({
        'totes-not-fake-addon': {
          'herp.js': '// slerpy',
          templates: {
            'derp.hbs': '<!-- flerpy -->',
          },
        },
      });
    })
  );
});
