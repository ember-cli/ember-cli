'use strict';

const expect = require('chai').expect;
const Funnel = require('broccoli-funnel');
const DefaultPackager = require('../../../../lib/broccoli/default-packager');
const broccoliTestHelper = require('broccoli-test-helper');
const defaultPackagerHelpers = require('../../../helpers/default-packager');

const createBuilder = broccoliTestHelper.createBuilder;
const createTempDir = broccoliTestHelper.createTempDir;
const setupRegistryFor = defaultPackagerHelpers.setupRegistryFor;

describe('Default Packager: Process Javascript', function () {
  let input, output;

  let scriptOutputFiles = {
    '/assets/vendor.js': [
      'vendor/ember-cli/vendor-prefix.js',
      'vendor/loader/loader.js',
      'vendor/ember/jquery/jquery.js',
      'vendor/ember-cli-shims/app-shims.js',
      'vendor/ember-resolver/legacy-shims.js',
      'vendor/ember/ember.debug.js',
    ],
  };
  let MODULES = {
    'addon-tree-output': {},
    'the-best-app-ever': {
      'router.js': 'router.js',
      'app.js': 'app.js',
      components: {
        'x-foo.js': 'export default class {}',
      },
      routes: {
        'application.js': 'export default class {}',
      },
      config: {
        'environment.js': 'environment.js',
      },
      templates: {},
    },
    vendor: {},
  };

  let project = {
    configPath() {
      return `${input.path()}/the-best-app-ever/config/environment`;
    },

    config() {
      return { a: 1 };
    },

    registry: setupRegistryFor('template', function (tree) {
      return new Funnel(tree, {
        getDestinationPath(relativePath) {
          return relativePath.replace(/hbs$/g, 'js');
        },
      });
    }),

    addons: [
      {
        treeForAddon(tree) {
          const Funnel = require('broccoli-funnel');
          return new Funnel(tree, {
            destDir: 'modules/my-addon',
          });
        },
      },
    ],
  };

  before(async function () {
    input = await createTempDir();

    input.write(MODULES);
  });

  after(async function () {
    await input.dispose();
  });

  afterEach(async function () {
    if (output) {
      await output.dispose();
    }
  });

  it('caches packaged application tree', async function () {
    let defaultPackager = new DefaultPackager({
      name: 'the-best-app-ever',
      env: 'development',

      distPaths: {
        appJsFile: '/assets/the-best-app-ever.js',
        vendorJsFile: '/assets/vendor.js',
      },

      registry: setupRegistryFor('template', function (tree) {
        return new Funnel(tree, {
          getDestinationPath(relativePath) {
            return relativePath.replace(/hbs$/g, 'js');
          },
        });
      }),

      customTransformsMap: new Map(),

      scriptOutputFiles,
      project,
    });

    expect(defaultPackager._cachedProcessedAppAndDependencies).to.equal(null);

    output = createBuilder(defaultPackager.processAppAndDependencies(input.path()));
    await output.build();

    expect(defaultPackager._cachedProcessedAppAndDependencies).to.not.equal(null);
    expect(defaultPackager._cachedProcessedAppAndDependencies._annotation).to.equal(
      'Processed Application and Dependencies'
    );
  });
});
