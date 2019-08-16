'use strict';

const co = require('co');
const expect = require('chai').expect;
const Funnel = require('broccoli-funnel');
const { isExperimentEnabled } = require('../../../../lib/experiments');
const DefaultPackager = require('../../../../lib/broccoli/default-packager');
const broccoliTestHelper = require('broccoli-test-helper');
const defaultPackagerHelpers = require('../../../helpers/default-packager');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;
const setupRegistryFor = defaultPackagerHelpers.setupRegistryFor;

describe('Default Packager: Styles', function() {
  let input, output;

  let styleOutputFiles = {
    '/assets/vendor.css': [
      'vendor/font-awesome/css/font-awesome.css',
      'bower_components/hint.css/hint.css',
      'vendor/1.css',
      'vendor/2.css',
      'vendor/3.css',
    ],
  };
  let MODULES = {
    'addon-tree-output': {},
    app: {
      styles: {
        'app.css': '@import "extra.css";\nhtml { height: 100%; }',
        'extra.css': 'body{ position: relative; }',
      },
    },
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
    bower_components: {
      'hint.css': {
        'hint.css': '',
      },
      '1.css': '.first {}',
      '2.css': '.second {}',
      '3.css': '.third { position: absolute; }',
    },
    vendor: {
      'font-awesome': {
        css: {
          'font-awesome.css': 'body { height: 100%; }',
        },
      },
    },
  };

  before(
    co.wrap(function*() {
      input = yield createTempDir();

      input.write(MODULES);
    })
  );

  after(
    co.wrap(function*() {
      yield input.dispose();
    })
  );

  afterEach(
    co.wrap(function*() {
      if (output) {
        yield output.dispose();
      }
    })
  );

  it(
    'caches packaged styles tree',
    co.wrap(function*() {
      let defaultPackager = new DefaultPackager({
        name: 'the-best-app-ever',
        env: 'development',

        distPaths: {
          appCssFile: '/assets/the-best-app-ever.css',
          vendorCssFile: '/assets/vendor.css',
        },

        registry: setupRegistryFor('css', function(tree) {
          return new Funnel(tree, {
            getDestinationPath(relativePath) {
              return relativePath.replace(/scss$/g, 'css');
            },
          });
        }),

        minifyCSS: {
          enabled: true,
          options: { processImport: false },
        },

        styleOutputFiles,

        project: { addons: [] },
      });

      expect(defaultPackager._cachedProcessedStyles).to.equal(null);

      output = yield buildOutput(defaultPackager.packageStyles(input.path()));

      expect(defaultPackager._cachedProcessedStyles).to.not.equal(null);
      expect(defaultPackager._cachedProcessedStyles._annotation).to.equal('Packaged Styles');
    })
  );

  it(
    'does not minify css files when minification is disabled',
    co.wrap(function*() {
      let defaultPackager = new DefaultPackager({
        name: 'the-best-app-ever',
        env: 'development',

        distPaths: {
          appCssFile: { app: '/assets/the-best-app-ever.css' },
          vendorCssFile: '/assets/vendor.css',
        },

        registry: {
          load: () => [],
        },

        minifyCSS: {
          enabled: false,
          options: {
            processImport: false,
            relativeTo: 'assets',
          },
        },

        styleOutputFiles,

        project: { addons: [] },
      });

      expect(defaultPackager._cachedProcessedStyles).to.equal(null);

      output = yield buildOutput(defaultPackager.packageStyles(input.path()));

      let outputFiles = output.read();

      expect(Object.keys(outputFiles.assets)).to.deep.equal(['extra.css', 'the-best-app-ever.css', 'vendor.css']);
      expect(outputFiles.assets['vendor.css'].trim()).to.equal('body { height: 100%; }');
      expect(outputFiles.assets['the-best-app-ever.css'].trim()).to.equal(
        '@import "extra.css";\nhtml { height: 100%; }'
      );
    })
  );

  it(
    'minifies css files when minification is enabled',
    co.wrap(function*() {
      let defaultPackager = new DefaultPackager({
        name: 'the-best-app-ever',
        env: 'development',

        distPaths: {
          appCssFile: { app: '/assets/the-best-app-ever.css' },
          vendorCssFile: '/assets/vendor.css',
        },

        registry: {
          load: () => [],
        },

        minifyCSS: {
          enabled: true,
          options: {
            processImport: false,
            relativeTo: 'assets',
          },
        },

        styleOutputFiles,

        project: { addons: [] },
      });

      expect(defaultPackager._cachedProcessedStyles).to.equal(null);

      output = yield buildOutput(defaultPackager.packageStyles(input.path()));

      let outputFiles = output.read();

      expect(Object.keys(outputFiles.assets)).to.deep.equal(['extra.css', 'the-best-app-ever.css', 'vendor.css']);
      expect(outputFiles.assets['vendor.css'].trim()).to.match(/^\S+$/, 'css file is minified');
      expect(outputFiles.assets['the-best-app-ever.css'].trim()).to.match(/^@import \S+$/, 'css file is minified');
    })
  );

  it(
    'processes css according to the registry',
    co.wrap(function*() {
      let defaultPackager = new DefaultPackager({
        name: 'the-best-app-ever',
        env: 'development',

        distPaths: {
          appCssFile: { app: '/assets/the-best-app-ever.css' },
          vendorCssFile: '/assets/vendor.css',
        },

        registry: setupRegistryFor('css', function(tree, inputPath, outputPath, options) {
          return new Funnel(tree, {
            getDestinationPath(relativePath) {
              if (relativePath.includes('app.css')) {
                return options.outputPaths.app.replace(/css$/g, 'zss');
              }

              return relativePath;
            },
          });
        }),

        minifyCSS: {
          enabled: true,
          options: {
            processImport: false,
            relativeTo: 'assets',
          },
        },

        styleOutputFiles,

        project: { addons: [] },
      });

      expect(defaultPackager._cachedProcessedStyles).to.equal(null);

      output = yield buildOutput(defaultPackager.packageStyles(input.path()));

      let outputFiles = output.read();

      expect(Object.keys(outputFiles.assets)).to.deep.equal(['the-best-app-ever.zss', 'vendor.css']);
    })
  );

  it(
    'inlines css imports',
    co.wrap(function*() {
      let defaultPackager = new DefaultPackager({
        name: 'the-best-app-ever',
        env: 'development',

        distPaths: {
          appCssFile: { app: '/assets/the-best-app-ever.css' },
          vendorCssFile: '/assets/vendor.css',
        },

        registry: {
          load: () => [],
        },

        minifyCSS: {
          enabled: true,
          options: {
            processImport: true,
            relativeTo: 'assets',
          },
        },

        styleOutputFiles,

        project: { addons: [] },
      });

      expect(defaultPackager._cachedProcessedStyles).to.equal(null);

      output = yield buildOutput(defaultPackager.packageStyles(input.path()));

      let outputFiles = output.read();

      expect(outputFiles.assets['the-best-app-ever.css'].trim()).to.not.include('@import');
      expect(outputFiles.assets['the-best-app-ever.css'].trim()).to.equal('body{position:relative}html{height:100%}');
    })
  );

  it(
    'runs pre/post-process add-on hooks',
    co.wrap(function*() {
      let addonPreprocessTreeHookCalled = false;
      let addonPostprocessTreeHookCalled = false;

      let defaultPackager = new DefaultPackager({
        name: 'the-best-app-ever',
        env: 'development',

        distPaths: {
          appCssFile: { app: '/assets/the-best-app-ever.css' },
          vendorCssFile: '/assets/vendor.css',
        },

        registry: {
          load: () => [],
        },

        minifyCSS: {
          enabled: true,
          options: {
            processImport: false,
            relativeTo: 'assets',
          },
        },

        styleOutputFiles,

        // avoid using `testdouble.js` here on purpose; it does not have a "proxy"
        // option, where a function call would be registered and the original
        // would be returned
        project: {
          addons: [
            {
              preprocessTree(type, tree) {
                addonPreprocessTreeHookCalled = true;

                return tree;
              },
              postprocessTree(type, tree) {
                addonPostprocessTreeHookCalled = true;

                return tree;
              },
            },
          ],
        },
      });

      expect(defaultPackager._cachedProcessedStyles).to.equal(null);

      output = yield buildOutput(defaultPackager.packageStyles(input.path()));

      expect(addonPreprocessTreeHookCalled).to.equal(true);
      expect(addonPostprocessTreeHookCalled).to.equal(true);
    })
  );

  it(
    'prevents duplicate inclusion, maintains order: CSS',
    co.wrap(function*() {
      let importFilesMap = {
        '/assets/vendor.css': [
          'bower_components/1.css',
          'bower_components/2.css',
          'bower_components/3.css',
          'bower_components/1.css',
        ],
      };
      let defaultPackager = new DefaultPackager({
        name: 'the-best-app-ever',
        env: 'development',

        distPaths: {
          appCssFile: { app: '/assets/the-best-app-ever.css' },
          vendorCssFile: '/assets/vendor.css',
        },

        registry: {
          load: () => [],
        },

        minifyCSS: {
          enabled: true,
          options: {
            processImport: false,
            relativeTo: 'assets',
          },
        },

        styleOutputFiles: importFilesMap,

        project: { addons: [] },
      });

      expect(defaultPackager._cachedProcessedStyles).to.equal(null);

      output = yield buildOutput(defaultPackager.packageStyles(input.path()));

      let outputFiles = output.read();

      expect(outputFiles.assets['vendor.css']).to.equal('.third{position:absolute}');
    })
  );

  if (isExperimentEnabled('MODULE_UNIFICATION')) {
    describe('with module unification layout', function() {
      let importFilesMap = {
        '/assets/vendor.css': ['vendor/font-awesome/css/font-awesome.css'],
      };
      let input, output, processedSrc;

      let MU_LAYOUT = {
        vendor: {
          'font-awesome': {
            css: {
              'font-awesome.css': 'body { height: 100%; }',
            },
          },
        },
        src: {
          'main.js': '',
          'resolver.js': '',
          'router.js': '',
          ui: {
            components: {
              'login-form': {
                'component.js': '',
                'template.hbs': '',
              },
            },
            'index.html': '',
            routes: {
              application: {
                'template.hbs': '',
              },
            },
            styles: {
              'app.css': 'html { height: 100%; }',
            },
          },
        },
      };
      let processedSrcFolder = {
        'the-best-app-ever': {
          src: MU_LAYOUT,
          assets: {
            'the-best-app-ever.css': 'html { height: 100%; }',
          },
        },
      };

      let defaultPackager = new DefaultPackager({
        name: 'the-best-app-ever',

        distPaths: {
          appCssFile: { app: '/assets/the-best-app-ever.css' },
          vendorCssFile: '/assets/vendor.css',
        },

        registry: {
          load: () => [],
        },

        minifyCSS: {
          enabled: true,
          options: {
            processImport: false,
            relativeTo: 'assets',
          },
        },

        styleOutputFiles: importFilesMap,

        isModuleUnificationEnabled: true,

        project: { addons: [] },
      });

      before(
        co.wrap(function*() {
          input = yield createTempDir();
          processedSrc = yield createTempDir();

          input.write(MU_LAYOUT);
          processedSrc.write(processedSrcFolder);
        })
      );

      after(
        co.wrap(function*() {
          yield input.dispose();
          yield processedSrc.dispose();
        })
      );

      afterEach(
        co.wrap(function*() {
          yield output.dispose();
        })
      );

      it(
        'processes styles according to the registry',
        co.wrap(function*() {
          defaultPackager._cachedProcessedSrc = processedSrc.path();

          output = yield buildOutput(defaultPackager.packageStyles(input.path()));

          let outputFiles = output.read();

          expect(outputFiles).to.deep.equal({
            assets: {
              'the-best-app-ever.css': 'html{height:100%}',
              'vendor.css': 'body{height:100%}',
            },
          });
        })
      );
    });
  }
});
