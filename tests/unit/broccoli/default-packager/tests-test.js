'use strict';

const stew = require('broccoli-stew');
const Funnel = require('broccoli-funnel');
const expect = require('chai').expect;
const { isExperimentEnabled } = require('../../../../lib/experiments');
const DefaultPackager = require('../../../../lib/broccoli/default-packager');
const broccoliTestHelper = require('broccoli-test-helper');
const defaultPackagerHelpers = require('../../../helpers/default-packager');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;
const setupRegistryFor = defaultPackagerHelpers.setupRegistryFor;

describe('Default Packager: Tests', function() {
  let input, output;
  let name = 'the-best-app-ever';
  let env = 'development';

  let TESTS = {
    'addon-tree-output': {},
    bower_components: {},
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
      custom: {
        'a.js': 'a.js',
        'a.css': 'a.css',
        'b.js': 'b.js',
        'b.css': 'b.css',
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
    },
    tests: {
      'addon-test-support': {
        '@ember': {
          'test-helpers': {
            'global.js':
              'define("@ember/test-helpers/global", ["exports"], function(exports) { Object.defineProperty(exports, "__esModule", { value: true }); });',
          },
        },
      },
      acceptance: {
        'login-test.js': ' // login-test.js',
        'logout-test.js': '',
      },
      lint: {
        'login-test.lint.js': ' // login-test.lint.js',
        'logout-test.lint.js': '',
      },
      helpers: {
        'resolver.js': '',
        'start-app.js': '',
      },
      'index.html': 'index',
      integration: {
        components: {
          'login-form-test.js': '',
          'user-menu-test.js': '',
        },
      },
      'test-helper.js': '// test-helper.js',
      unit: {
        services: {
          'session-test.js': '',
        },
      },
    },
  };

  let project = {
    configPath() {
      return `${input.path()}/the-best-app-ever/config/environment`;
    },

    config() {
      return {
        a: 1,
        modulePrefix: 'the-best-app-ever',
      };
    },

    addons: [
      {
        // this lintTree implementation will return the same
        // files as the input tree, but the contents will be
        // different
        lintTree(type, tree) {
          return stew.map(tree, string => string.toUpperCase());
        },
      },
    ],
  };

  before(async function() {
    input = await createTempDir();

    input.write(TESTS);
  });

  after(async function() {
    await input.dispose();
  });

  afterEach(async function() {
    await output.dispose();
  });

  it('caches packaged tests tree', async function() {
    let defaultPackager = new DefaultPackager({
      project,
      name,
      env,
      areTestsEnabled: true,

      distPaths: {
        testJsFile: '/assets/tests.js',
        testSupportJsFile: {
          testSupport: '/assets/test-support.js',
          testLoader: '/assets/test-loader.js',
        },
        testSupportCssFile: '/assets/test-support.css',
      },

      customTransformsMap: new Map(),

      vendorTestStaticStyles: [],
      legacyTestFilesToAppend: [],

      registry: setupRegistryFor('js', tree => tree),
    });

    expect(defaultPackager._cachedTests).to.equal(null);

    output = await buildOutput(defaultPackager.packageTests(input.path()));

    expect(defaultPackager._cachedTests).to.not.equal(null);
  });

  it('packages test files (with sourcemaps)', async function() {
    let defaultPackager = new DefaultPackager({
      project,
      name,
      env,
      areTestsEnabled: true,

      distPaths: {
        testJsFile: '/assets/tests.js',
        testSupportJsFile: {
          testSupport: '/assets/test-support.js',
          testLoader: '/assets/test-loader.js',
        },
        testSupportCssFile: '/assets/test-support.css',
      },

      customTransformsMap: new Map(),

      vendorTestStaticStyles: [],
      legacyTestFilesToAppend: [],

      registry: setupRegistryFor('js', tree => tree),
    });

    output = await buildOutput(defaultPackager.packageTests(input.path()));

    let outputFiles = output.read();

    expect(Object.keys(outputFiles.tests)).to.deep.equal(['index.html']);

    expect(Object.keys(outputFiles.assets)).to.deep.equal([
      'test-support.js',
      'test-support.map',
      'tests.js',
      'tests.map',
    ]);

    expect(Object.keys(outputFiles)).to.deep.equal(['assets', 'testem.js', 'tests']);

    expect(outputFiles.assets['tests.js']).to.include('login-test.js');
    expect(outputFiles.assets['tests.js']).to.include('login-test.lint.js');
    expect(outputFiles.assets['tests.js']).to.include('test-helper');
    expect(outputFiles.assets['tests.js']).to.include(`define('the-best-app-ever/config/environment'`);
    expect(outputFiles.assets['tests.js']).to.include(`require('the-best-app-ever/tests/test-helper');`);
    expect(outputFiles.assets['tests.js']).to.include('EmberENV.TESTS_FILE_LOADED = true;');
  });

  it('packages test files (without sourcemaps)', async function() {
    let defaultPackager = new DefaultPackager({
      project,
      name,
      env,
      areTestsEnabled: true,
      sourcemaps: { enabled: false },

      distPaths: {
        testJsFile: '/assets/tests.js',
        testSupportJsFile: {
          testSupport: '/assets/test-support.js',
          testLoader: '/assets/test-loader.js',
        },
        testSupportCssFile: '/assets/test-support.css',
      },

      customTransformsMap: new Map(),

      vendorTestStaticStyles: [],
      legacyTestFilesToAppend: [],

      registry: setupRegistryFor('js', tree => tree),
    });

    output = await buildOutput(defaultPackager.packageTests(input.path()));

    let outputFiles = output.read();

    expect(Object.keys(outputFiles.tests)).to.deep.equal(['index.html']);

    expect(Object.keys(outputFiles.assets)).to.deep.equal(['test-support.js', 'tests.js']);

    expect(Object.keys(outputFiles)).to.deep.equal(['assets', 'testem.js', 'tests']);

    expect(outputFiles.assets['tests.js']).to.include('login-test.js');
    expect(outputFiles.assets['tests.js']).to.include('login-test.lint.js');
    expect(outputFiles.assets['tests.js']).to.include('test-helper');
    expect(outputFiles.assets['tests.js']).to.include(`define('the-best-app-ever/config/environment'`);
    expect(outputFiles.assets['tests.js']).to.include(`require('the-best-app-ever/tests/test-helper');`);
    expect(outputFiles.assets['tests.js']).to.include('EmberENV.TESTS_FILE_LOADED = true;');
  });

  it('does not process `addon-test-support` folder', async function() {
    let defaultPackager = new DefaultPackager({
      project,
      name,
      env,
      areTestsEnabled: true,

      distPaths: {
        testJsFile: '/assets/tests.js',
        testSupportJsFile: {
          testSupport: '/assets/test-support.js',
          testLoader: '/assets/test-loader.js',
        },
        testSupportCssFile: '/assets/test-support.css',
      },

      customTransformsMap: new Map(),

      vendorTestStaticStyles: [],
      legacyTestFilesToAppend: [],

      registry: setupRegistryFor('js', function(tree) {
        return new Funnel(tree, {
          getDestinationPath(relativePath) {
            return relativePath.replace(/js/g, 'js-test');
          },
        });
      }),
    });

    output = await buildOutput(defaultPackager.processTests(input.path()));

    let outputFiles = output.read();

    expect(outputFiles).to.deep.equal({
      'addon-test-support': {
        '@ember': {
          'test-helpers': {
            'global.js':
              'define("@ember/test-helpers/global", ["exports"], function(exports) { Object.defineProperty(exports, "__esModule", { value: true }); });',
          },
        },
      },
      [name]: {
        tests: {
          acceptance: {
            'login-test.js-test': ' // login-test.js',
            'logout-test.js-test': '',
          },
          lint: {
            'login-test.lint.js-test': ' // login-test.lint.js',
            'logout-test.lint.js-test': '',
          },
          helpers: {
            'resolver.js-test': '',
            'start-app.js-test': '',
          },
          'index.html': 'index',
          integration: {
            components: {
              'login-form-test.js-test': '',
              'user-menu-test.js-test': '',
            },
          },
          'test-helper.js-test': '// test-helper.js',
          unit: {
            services: {
              'session-test.js-test': '',
            },
          },
        },
      },
    });
  });

  it('processes tests files according to the registry', async function() {
    let defaultPackager = new DefaultPackager({
      project,
      name,
      env,
      areTestsEnabled: true,

      distPaths: {
        testJsFile: '/assets/tests.js',
        testSupportJsFile: {
          testSupport: '/assets/test-support.js',
          testLoader: '/assets/test-loader.js',
        },
        testSupportCssFile: '/assets/test-support.css',
      },

      customTransformsMap: new Map(),

      vendorTestStaticStyles: [],
      legacyTestFilesToAppend: [],

      registry: setupRegistryFor('js', function(tree) {
        return new Funnel(tree, {
          getDestinationPath(relativePath) {
            return relativePath.replace(/js/g, 'js-test');
          },
        });
      }),
    });

    output = await buildOutput(defaultPackager.processTests(input.path()));

    let outputFiles = output.read();

    expect(outputFiles).to.deep.equal({
      'addon-test-support': {
        '@ember': {
          'test-helpers': {
            'global.js':
              'define("@ember/test-helpers/global", ["exports"], function(exports) { Object.defineProperty(exports, "__esModule", { value: true }); });',
          },
        },
      },
      [name]: {
        tests: {
          acceptance: {
            'login-test.js-test': ' // login-test.js',
            'logout-test.js-test': '',
          },
          lint: {
            'login-test.lint.js-test': ' // login-test.lint.js',
            'logout-test.lint.js-test': '',
          },
          helpers: {
            'resolver.js-test': '',
            'start-app.js-test': '',
          },
          'index.html': 'index',
          integration: {
            components: {
              'login-form-test.js-test': '',
              'user-menu-test.js-test': '',
            },
          },
          'test-helper.js-test': '// test-helper.js',
          unit: {
            services: {
              'session-test.js-test': '',
            },
          },
        },
      },
    });
  });

  it('emits dist/assets/tests.js by default', async function() {
    let emptyInput = await createTempDir();
    let emptyTestFolder = {
      'addon-tree-output': {},
      bower_components: {},
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
      },
      tests: {
        'test-helper.js': '// test-helper.js',
      },
    };

    emptyInput.write(emptyTestFolder);

    let project = {
      configPath() {
        return `${emptyInput.path()}/the-best-app-ever/config/environment`;
      },

      config() {
        return { a: 1 };
      },

      addons: [],
    };

    let defaultPackager = new DefaultPackager({
      project,
      name,
      env,
      areTestsEnabled: true,

      distPaths: {
        testJsFile: '/assets/tests.js',
        testSupportJsFile: {
          testSupport: '/assets/test-support.js',
          testLoader: '/assets/test-loader.js',
        },
        testSupportCssFile: '/assets/test-support.css',
      },

      customTransformsMap: new Map(),

      vendorTestStaticStyles: [],
      legacyTestFilesToAppend: [],

      registry: setupRegistryFor('js', tree => tree),
    });

    output = await buildOutput(defaultPackager.packageTests(input.path()));

    let outputFiles = output.read();

    expect(Object.keys(outputFiles.tests)).to.deep.equal(['index.html']);

    expect(Object.keys(outputFiles.assets)).to.deep.equal([
      'test-support.js',
      'test-support.map',
      'tests.js',
      'tests.map',
    ]);

    expect(Object.keys(outputFiles)).to.deep.equal(['assets', 'testem.js', 'tests']);

    emptyInput.dispose();
  });

  it('lintTree results do not "win" over app tests', async function() {
    let defaultPackager = new DefaultPackager({
      project,
      name,
      env,
      areTestsEnabled: true,

      distPaths: {
        testJsFile: '/assets/tests.js',
        testSupportJsFile: {
          testSupport: '/assets/test-support.js',
          testLoader: '/assets/test-loader.js',
        },
        testSupportCssFile: '/assets/test-support.css',
      },

      customTransformsMap: new Map(),

      vendorTestStaticStyles: [],
      legacyTestFilesToAppend: [],

      registry: setupRegistryFor('js', tree => tree),
    });

    output = await buildOutput(defaultPackager.packageTests(input.path()));

    let outputFiles = output.read();

    // confirm this contains the original value
    // unmodified by the `lintTree` added above
    expect(outputFiles.assets['tests.js']).to.include('// login-test.js');
  });

  it('maintains the concatenation order', async function() {
    let defaultPackager = new DefaultPackager({
      project,
      name,
      env,
      areTestsEnabled: true,

      distPaths: {
        testJsFile: '/assets/tests.js',
        testSupportJsFile: {
          testSupport: '/assets/test-support.js',
          testLoader: '/assets/test-loader.js',
        },
        testSupportCssFile: '/assets/test-support.css',
      },

      customTransformsMap: new Map(),

      vendorTestStaticStyles: ['vendor/custom/a.css', 'vendor/custom/b.css'],
      legacyTestFilesToAppend: ['vendor/custom/a.js', 'vendor/custom/b.js'],

      registry: setupRegistryFor('js', tree => tree),
    });

    output = await buildOutput(defaultPackager.packageTests(input.path()));

    let outputFiles = output.read();

    expect(outputFiles.assets['test-support.js']).to.include('a.js\nb.js');
    expect(outputFiles.assets['test-support.css']).to.include('a.css\nb.css');
  });

  if (isExperimentEnabled('MODULE_UNIFICATION')) {
    describe('with module unification layout', function() {
      let input, output;

      let MU_LAYOUT = {
        vendor: {
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
        },
        tests: {
          'addon-test-support': {},
          acceptance: {
            'login-test.js': ' // login-test.js',
            'logout-test.js': '',
          },
          lint: {
            'login-test.lint.js': ' // login-test.lint.js',
            'logout-test.lint.js': '',
          },
          'index.html': 'index',
        },
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

      before(async function() {
        input = await createTempDir();

        input.write(MU_LAYOUT);
      });

      after(async function() {
        await input.dispose();
      });

      afterEach(async function() {
        await output.dispose();
      });

      it('packages test files', async function() {
        let defaultPackager = new DefaultPackager({
          project,
          name,
          env,
          areTestsEnabled: true,

          distPaths: {
            testJsFile: '/assets/tests.js',
            testSupportJsFile: {
              testSupport: '/assets/test-support.js',
              testLoader: '/assets/test-loader.js',
            },
            testSupportCssFile: '/assets/test-support.css',
          },

          customTransformsMap: new Map(),

          isModuleUnificationEnabled: true,

          vendorTestStaticStyles: [],
          legacyTestFilesToAppend: [],

          registry: setupRegistryFor('js', tree => tree),
        });

        output = await buildOutput(defaultPackager.packageTests(input.path()));

        let outputFiles = output.read();

        expect(Object.keys(outputFiles.tests)).to.deep.equal(['index.html']);

        expect(Object.keys(outputFiles.assets)).to.deep.equal([
          'test-support.js',
          'test-support.map',
          'tests.js',
          'tests.map',
        ]);

        expect(Object.keys(outputFiles)).to.deep.equal(['assets', 'testem.js', 'tests']);

        expect(outputFiles.assets['tests.js']).to.include('login-form-component-test');
        expect(outputFiles.assets['tests.js']).to.include('login-test.js');
        expect(outputFiles.assets['tests.js']).to.include('login-test.lint.js');
        expect(outputFiles.assets['tests.js']).to.include('test-helper');
        expect(outputFiles.assets['tests.js']).to.include(`define('the-best-app-ever/config/environment'`);
        expect(outputFiles.assets['tests.js']).to.include(`require('the-best-app-ever/tests/test-helper');`);
        expect(outputFiles.assets['tests.js']).to.include('EmberENV.TESTS_FILE_LOADED = true;');
      });
    });
  }
});
