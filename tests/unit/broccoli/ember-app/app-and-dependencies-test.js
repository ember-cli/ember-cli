'use strict';

const broccoliTestHelper = require('broccoli-test-helper');
const { expect } = require('chai');

const EmberApp = require('../../../../lib/broccoli/ember-app');
const MockCLI = require('../../../helpers/mock-cli');
const Project = require('../../../../lib/models/project');

const createBuilder = broccoliTestHelper.createBuilder;
const createTempDir = broccoliTestHelper.createTempDir;
const walkSync = require('walk-sync');

const EMBER_SOURCE_ADDON = {
  name: 'ember-source',
  paths: {
    debug: 'vendor/ember/ember.js',
    prod: 'vendor/ember/ember.js',
    testing: 'vendor/ember/ember-testing.js',
  },
  pkg: {
    name: 'ember-source',
  },
};

describe('EmberApp#appAndDependencies', function () {
  let input, output;

  beforeEach(async function () {
    process.env.EMBER_ENV = 'development';

    input = await createTempDir();

    input.write({
      node_modules: {
        'fake-template-preprocessor': {
          'package.json': JSON.stringify({
            name: 'fake-template-preprocessor',
            main: 'index.js',
            keywords: ['ember-addon'],
          }),
          'index.js': `
            module.exports = {
              name: 'fake-template-preprocessor',
              setupPreprocessorRegistry(type, registry) {
                registry.add('template', {
                  isDefaultForType: true,
                  name: 'fake-template-preprocessor',
                  ext: 'hbs',
                  toTree(tree) { return tree; }
                });
              }
            };
          `,
        },
      },
      config: {
        'environment.js': `module.exports = function() { return { modulePrefix: 'test-app' }; };`,
      },
    });
  });

  afterEach(async function () {
    delete process.env.EMBER_ENV;
    await input.dispose();

    if (output) {
      await output.dispose();
    }
  });

  function createApp(options) {
    options = options || {};

    let pkg = {
      name: 'ember-app-test',
      dependencies: {
        'fake-template-preprocessor': '*',
        'my-addon': '*',
      },
    };

    let cli = new MockCLI();
    let project = new (class extends Project {
      initializeAddons() {
        if (this._addonsInitialized) {
          return;
        }

        super.initializeAddons();

        this.addons.push(EMBER_SOURCE_ADDON);
      }
    })(input.path(), pkg, cli.ui, cli);

    return new EmberApp(
      {
        project,
        name: pkg.name,
        _ignoreMissingLoader: true,
        sourcemaps: { enabled: false },
      },
      options
    );
  }

  function getFiles(path) {
    return walkSync(path, {
      ignore: ['vendor/ember-cli/**/*'],
      directories: false,
    });
  }

  it('moduleNormalizerDisabled', async function () {
    input.write({
      node_modules: {
        'my-addon': {
          addon: {
            'index.js': `define('amd', function() {});`,
          },
          'package.json': JSON.stringify({
            name: 'my-addon',
            main: 'index.js',
            keywords: ['ember-addon'],
          }),
          'index.js': `
            module.exports = {
              name: 'my-addon',
              setupPreprocessorRegistry(type, registry) {
                registry.add('template', { ext: 'hbs', toTree(tree) { return tree; } });
                registry.add('js', { ext: 'js', toTree(tree) { return tree; } });
              },
            }
          `,
        },
      },
    });

    let app = createApp({
      moduleNormalizerDisabled: true,
    });

    let addon = app.project.findAddonByName('my-addon');

    addon.treeForAddon = (tree) => {
      const Funnel = require('broccoli-funnel');
      return new Funnel(tree, {
        destDir: 'modules/my-addon',
      });
    };

    output = createBuilder(app.getExternalTree());
    await output.build();
    let actualFiles = getFiles(output.path());

    expect(actualFiles).to.contain('addon-tree-output/modules/my-addon/index.js');
  });
});
