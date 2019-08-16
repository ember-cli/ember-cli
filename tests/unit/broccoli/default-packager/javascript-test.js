'use strict';

const co = require('co');
const expect = require('chai').expect;
const Funnel = require('broccoli-funnel');
const DefaultPackager = require('../../../../lib/broccoli/default-packager');
const broccoliTestHelper = require('broccoli-test-helper');
const defaultPackagerHelpers = require('../../../helpers/default-packager');
const { isExperimentEnabled } = require('../../../../lib/experiments');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;
const setupRegistry = defaultPackagerHelpers.setupRegistry;
const setupRegistryFor = defaultPackagerHelpers.setupRegistryFor;

describe('Default Packager: Javascript', function() {
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
    'addon-tree-output': {
      'ember-ajax': {
        'request.js': '',
      },
      'ember-cli-app-version': {
        'initializer-factory.js': '',
      },
      modules: {
        'ember-data': {
          'transform.js': '',
          'store.js': '',
        },
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
    vendor: {
      loader: {
        'loader.js': '',
      },
      ember: {
        jquery: {
          'jquery.js': '',
        },
        'ember.debug.js': '',
      },
      'ember-cli': {
        'app-boot.js': 'app-boot.js',
        'app-config.js': 'app-config.js',
        'app-prefix.js': 'app-prefix.js',
        'app-suffix.js': 'app-suffix.js',
        'test-support-prefix.js': 'test-support-prefix.js',
        'test-support-suffix.js': 'test-support-suffix.js',
        'tests-prefix.js': 'tests-prefix.js',
        'tests-suffix.js': 'tests-suffix.js',
        'vendor-prefix.js': 'vendor-prefix.js',
        'vendor-suffix.js': 'vendor-suffix.js',
      },
      'ember-cli-shims': {
        'app-shims.js': '',
      },
      'ember-resolver': {
        'legacy-shims.js': '',
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
      yield output.dispose();
    })
  );

  it(
    'caches packaged javascript tree',
    co.wrap(function*() {
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

        customTransformsMap: new Map(),

        scriptOutputFiles,
        project,
      });

      expect(defaultPackager._cachedJavascript).to.equal(null);

      output = yield buildOutput(defaultPackager.packageJavascript(input.path()));

      expect(defaultPackager._cachedJavascript).to.not.equal(null);
      expect(defaultPackager._cachedJavascript._annotation).to.equal('Packaged Javascript');
    })
  );

  it(
    'packages javascript files with sourcemaps on',
    co.wrap(function*() {
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

        customTransformsMap: new Map(),

        scriptOutputFiles,
        project,
      });

      output = yield buildOutput(defaultPackager.packageJavascript(input.path()));

      let outputFiles = output.read();

      expect(Object.keys(outputFiles.assets)).to.deep.equal([
        'the-best-app-ever.js',
        'the-best-app-ever.map',
        'vendor.js',
        'vendor.map',
      ]);
    })
  );

  it(
    'packages javascript files with sourcemaps off',
    co.wrap(function*() {
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

        sourcemaps: {
          enabled: false,
        },

        customTransformsMap: new Map(),

        scriptOutputFiles,
        project,
      });

      output = yield buildOutput(defaultPackager.packageJavascript(input.path()));

      let outputFiles = output.read();

      expect(Object.keys(outputFiles.assets)).to.deep.equal(['the-best-app-ever.js', 'vendor.js']);
    })
  );

  it(
    'processes javascript according to the registry',
    co.wrap(function*() {
      let defaultPackager = new DefaultPackager({
        name: 'the-best-app-ever',

        registry: setupRegistryFor('js', function(tree) {
          return new Funnel(tree, {
            getDestinationPath(relativePath) {
              return relativePath.replace(/js/g, 'jsx');
            },
          });
        }),

        project: { addons: [] },
      });

      expect(defaultPackager._cachedProcessedJavascript).to.equal(null);

      output = yield buildOutput(defaultPackager.processJavascript(input.path()));

      let outputFiles = output.read();

      expect(outputFiles['the-best-app-ever']).to.deep.equal({
        'app.jsx': 'app.js',
        components: {
          'x-foo.jsx': 'export default class {}',
        },
        routes: {
          'application.jsx': 'export default class {}',
        },
        config: {
          'environment.jsx': 'environment.js',
        },
        'router.jsx': 'router.js',
      });
    })
  );

  it(
    'runs pre/post-process add-on hooks',
    co.wrap(function*() {
      let addonPreprocessTreeHookCalled = false;
      let addonPostprocessTreeHookCalled = false;

      let defaultPackager = new DefaultPackager({
        name: 'the-best-app-ever',

        registry: setupRegistryFor('js', tree => tree),

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

      expect(defaultPackager._cachedProcessedJavascript).to.equal(null);

      output = yield buildOutput(defaultPackager.processJavascript(input.path()));

      expect(addonPreprocessTreeHookCalled).to.equal(true);
      expect(addonPostprocessTreeHookCalled).to.equal(true);
    })
  );
});

if (isExperimentEnabled('MODULE_UNIFICATION')) {
  // there is a little code duplication here (mainly the ceremony around
  // setting up the folder structure and disposing of it after the tests are
  // executed; once we enable MU flag by defaul, we should clean this up a tad
  describe('with module unification layout', function() {
    let inputMU, outputMU;
    let addonPreprocessTreeHookCalled = false;
    let addonPostprocessTreeHookCalled = false;

    let MU_LAYOUT = {
      'addon-tree-output': {},
      public: {},
      tests: {},
      vendor: {},
      src: {
        'main.js': '',
        'resolver.js': '',
        'router.js': '',
        ui: {
          components: {
            'login-form': {
              'component-test.js': ' // login-form-component-test',
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
    before(
      co.wrap(function*() {
        inputMU = yield createTempDir();

        inputMU.write(MU_LAYOUT);
      })
    );

    after(
      co.wrap(function*() {
        yield inputMU.dispose();
      })
    );

    afterEach(
      co.wrap(function*() {
        yield outputMU.dispose();
      })
    );

    it(
      'processes javascript according to the registry',
      co.wrap(function*() {
        let defaultPackager = new DefaultPackager({
          name: 'the-best-app-ever',

          distPaths: {
            appJsFile: '/assets/the-best-app-ever.js',
            appCssFile: '/assets/the-best-app-ever.css',
            vendorJsFile: '/assets/vendor.js',
          },

          registry: setupRegistry({
            js: tree => tree,
          }),

          isModuleUnificationEnabled: true,

          // avoid using `testdouble.js` here on purpose; it does not have a "proxy"
          // option, where a function call would be registered and the original
          // would be returned
          project: {
            addons: [
              {
                preprocessTree(type, tree) {
                  expect(type).to.equal('src');
                  return tree;
                },
                postprocessTree(type, tree) {
                  expect(type).to.equal('src');
                  return tree;
                },
              },
            ],
          },
        });

        expect(defaultPackager._cachedProcessedSrc).to.equal(null);

        outputMU = yield buildOutput(defaultPackager.processJavascriptSrc(inputMU.path()));

        let outputFiles = outputMU.read();

        expect(outputFiles['the-best-app-ever']).to.deep.equal({
          src: {
            'main.js': '',
            'resolver.js': '',
            'router.js': '',
            ui: {
              components: {
                'login-form': {
                  'component.js': '',
                },
              },
            },
          },
        });
      })
    );

    it(
      'runs pre/post-process add-on hooks',
      co.wrap(function*() {
        addonPreprocessTreeHookCalled = false;
        addonPostprocessTreeHookCalled = false;

        let defaultPackager = new DefaultPackager({
          name: 'the-best-app-ever',

          distPaths: {
            appJsFile: '/assets/the-best-app-ever.js',
            appCssFile: '/assets/the-best-app-ever.css',
            vendorJsFile: '/assets/vendor.js',
          },

          registry: setupRegistry({
            js: tree => tree,
          }),

          isModuleUnificationEnabled: true,

          // avoid using `testdouble.js` here on purpose; it does not have a "proxy"
          // option, where a function call would be registered and the original
          // would be returned
          project: {
            addons: [
              {
                preprocessTree(type, tree) {
                  expect(type).to.equal('src');
                  addonPreprocessTreeHookCalled = true;

                  return tree;
                },
                postprocessTree(type, tree) {
                  expect(type).to.equal('src');
                  addonPostprocessTreeHookCalled = true;

                  return tree;
                },
              },
            ],
          },
        });

        outputMU = yield buildOutput(defaultPackager.processJavascriptSrc(inputMU.path()));

        expect(addonPreprocessTreeHookCalled).to.equal(true);
        expect(addonPostprocessTreeHookCalled).to.equal(true);
      })
    );
  });
}
