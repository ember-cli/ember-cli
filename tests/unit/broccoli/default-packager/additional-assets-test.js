'use strict';

const expect = require('chai').expect;
const Funnel = require('broccoli-funnel');
const DefaultPackager = require('../../../../lib/broccoli/default-packager');
const broccoliTestHelper = require('broccoli-test-helper');
const defaultPackagerHelpers = require('../../../helpers/default-packager');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;
const setupRegistryFor = defaultPackagerHelpers.setupRegistryFor;

describe('Default Packager: Additional Assets', function() {
  let input, output;

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
    vendor: {
      'font-awesome': {
        fonts: {
          'FontAwesome.otf': '',
          'FontAwesome.woff': '',
        },
      },
    },
  };
  let project = {
    configPath() {
      return `${input.path()}/the-best-app-ever/config/environment`;
    },

    config() {
      return { a: 1 };
    },

    registry: setupRegistryFor('template', function(tree) {
      return new Funnel(tree, {
        getDestinationPath(relativePath) {
          return relativePath.replace(/hbs$/g, 'js');
        },
      });
    }),

    addons: [],
  };

  before(async function() {
    input = await createTempDir();

    input.write(MODULES);
  });

  after(async function() {
    await input.dispose();
  });

  afterEach(async function() {
    await output.dispose();
  });

  it('caches packaged javascript tree', async function() {
    let defaultPackager = new DefaultPackager({
      name: 'the-best-app-ever',
      env: 'development',

      distPaths: {
        appJsFile: '/assets/the-best-app-ever.js',
        vendorJsFile: '/assets/vendor.js',
      },

      registry: setupRegistryFor('template', function(tree) {
        return new Funnel(tree, {
          getDestinationPath(relativePath) {
            return relativePath.replace(/hbs$/g, 'js');
          },
        });
      }),

      additionalAssetPaths: [
        {
          src: 'vendor/font-awesome/fonts',
          file: 'FontAwesome.otf',
          dest: 'fonts',
        },
        {
          src: 'vendor/font-awesome/fonts',
          file: 'FontAwesome.woff',
          dest: 'fonts',
        },
      ],

      project,
    });

    expect(defaultPackager._cachedProcessedAdditionalAssets).to.equal(null);

    output = await buildOutput(defaultPackager.importAdditionalAssets(input.path()));

    expect(defaultPackager._cachedProcessedAdditionalAssets).to.not.equal(null);
    expect(defaultPackager._cachedProcessedAdditionalAssets._annotation).to.equal(
      'vendor/font-awesome/fonts/{FontAwesome.otf,FontAwesome.woff} => fonts/{FontAwesome.otf,FontAwesome.woff}'
    );
  });

  it('imports additional assets properly', async function() {
    let defaultPackager = new DefaultPackager({
      name: 'the-best-app-ever',
      env: 'development',

      distPaths: {
        appJsFile: '/assets/the-best-app-ever.js',
        vendorJsFile: '/assets/vendor.js',
      },

      registry: setupRegistryFor('template', function(tree) {
        return new Funnel(tree, {
          getDestinationPath(relativePath) {
            return relativePath.replace(/hbs$/g, 'js');
          },
        });
      }),

      additionalAssetPaths: [
        {
          src: 'vendor/font-awesome/fonts',
          file: 'FontAwesome.otf',
          dest: 'fonts',
        },
        {
          src: 'vendor/font-awesome/fonts',
          file: 'FontAwesome.woff',
          dest: 'fonts',
        },
      ],

      project,
    });

    expect(defaultPackager._cachedProcessedAdditionalAssets).to.equal(null);

    output = await buildOutput(defaultPackager.importAdditionalAssets(input.path()));

    let outputFiles = output.read();

    expect(outputFiles).to.deep.equal({
      fonts: {
        'FontAwesome.otf': '',
        'FontAwesome.woff': '',
      },
    });
  });
});
