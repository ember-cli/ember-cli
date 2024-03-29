'use strict';

const path = require('path');
const FixturifyProject = require('../../helpers/fixturify-project');
const Project = require('../../../lib/models/project');
const { expect } = require('chai');
const td = require('testdouble');
const broccoliTestHelper = require('broccoli-test-helper');
const { WatchedDir, UnwatchedDir } = require('broccoli-source');

const createBuilder = broccoliTestHelper.createBuilder;
const createTempDir = broccoliTestHelper.createTempDir;

const MockCLI = require('../../helpers/mock-cli');
const BroccoliMergeTrees = require('broccoli-merge-trees').MergeTrees;

let EmberApp = require('../../../lib/broccoli/ember-app');
const Addon = require('../../../lib/models/addon');

function mockTemplateRegistry(app) {
  let oldLoad = app.registry.load;
  app.registry.load = function (type) {
    if (type === 'template') {
      return [
        {
          toTree: (tree) => tree,
        },
      ];
    }
    return oldLoad.apply(app.registry, arguments);
  };
}

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

describe('EmberApp', function () {
  let project, projectPath, app, addon;

  function setupProject(rootPath) {
    const packageContents = require(path.join(rootPath, 'package.json'));
    let cli = new MockCLI();

    project = new Project(rootPath, packageContents, cli.ui, cli);
    project.require = function () {
      return function () {};
    };
    project.initializeAddons = function () {
      this.addons = [EMBER_SOURCE_ADDON];
    };

    return project;
  }

  beforeEach(function () {
    projectPath = path.resolve(__dirname, '../../fixtures/addon/simple');
    project = setupProject(projectPath);
  });

  describe('getStyles()', function () {
    it('can handle empty styles folders', async function () {
      let appStyles = await createTempDir();
      appStyles.write({
        'app.css': '// css styles',
      });

      let app = new EmberApp({
        project,
        trees: {
          styles: appStyles.path(),
        },
      });

      app.addonTreesFor = () => [];

      let output = createBuilder(app.getStyles());
      await output.build();
      let outputFiles = output.read();

      expect(outputFiles).to.deep.equal({
        app: {
          styles: {
            'app.css': '// css styles',
          },
        },
      });

      await output.dispose();
    });

    it('can handle empty addon styles folders', async function () {
      let appOptions = { project };

      let app = new EmberApp(appOptions);

      let AddonFoo = Addon.extend({
        root: 'foo',
        packageRoot: 'foo',
        name: 'foo',
      });
      let addonFoo = new AddonFoo(app, project);
      app.project.addons.push(addonFoo);

      let output = createBuilder(app.getStyles());
      await output.build();
      let outputFiles = output.read();

      let expectedOutput = {};
      expect(outputFiles).to.deep.equal(expectedOutput);

      await output.dispose();
    });

    it('add `app/styles` folder from add-ons', async function () {
      let addonFooStyles = await createTempDir();

      addonFooStyles.write({
        app: {
          styles: {
            'foo.css': 'foo',
          },
        },
      });

      let appOptions = { project };

      let app = new EmberApp(appOptions);

      let AddonFoo = Addon.extend({
        root: 'foo',
        packageRoot: 'foo',
        name: 'foo',
        treeForStyles() {
          return addonFooStyles.path();
        },
      });
      let addonFoo = new AddonFoo(app, project);
      app.project.addons.push(addonFoo);

      let output = createBuilder(app.getStyles());
      await output.build();
      let outputFiles = output.read();

      let expectedOutput = {
        app: {
          styles: {
            'foo.css': 'foo',
          },
        },
      };
      expect(outputFiles).to.deep.equal(expectedOutput);

      await addonFooStyles.dispose();
      await output.dispose();
    });

    it('returns add-ons styles files', async function () {
      let addonFooStyles = await createTempDir();
      let addonBarStyles = await createTempDir();

      // `ember-basic-dropdown`
      addonFooStyles.write({
        app: {
          styles: {
            'foo.css': 'foo',
          },
        },
      });
      // `ember-bootstrap`
      addonBarStyles.write({
        baztrap: {
          'baztrap.css': '// baztrap.css',
        },
      });

      let app = new EmberApp({
        project,
      });
      app.addonTreesFor = function () {
        return [addonFooStyles.path(), addonBarStyles.path()];
      };

      let output = createBuilder(app.getStyles());
      await output.build();
      let outputFiles = output.read();

      expect(outputFiles).to.deep.equal({
        app: {
          styles: {
            'foo.css': 'foo',
          },
        },
        baztrap: {
          'baztrap.css': '// baztrap.css',
        },
      });

      await addonFooStyles.dispose();
      await addonBarStyles.dispose();
      await output.dispose();
    });

    it('does not fail if add-ons do not export styles', async function () {
      let app = new EmberApp({
        project,
      });
      app.addonTreesFor = () => [];

      let output = createBuilder(app.getStyles());
      await output.build();
      let outputFiles = output.read();

      expect(outputFiles).to.deep.equal({});

      await output.dispose();
    });
  });

  describe('getPublic()', function () {
    it('returns public files for app and add-ons', async function () {
      let input = await createTempDir();
      let addonFooPublic = await createTempDir();
      let addonBarPublic = await createTempDir();

      input.write({
        'crossdomain.xml': '',
        'robots.txt': '',
      });
      addonFooPublic.write({
        foo: 'foo',
      });
      addonBarPublic.write({
        bar: 'bar',
      });

      app = new EmberApp({
        project,
      });

      app.trees.public = input.path();
      app.addonTreesFor = function () {
        return [addonFooPublic.path(), addonBarPublic.path()];
      };

      let output = createBuilder(app.getPublic());
      await output.build();
      let outputFiles = output.read();

      expect(outputFiles).to.deep.equal({
        public: {
          'crossdomain.xml': '',
          'robots.txt': '',
          foo: 'foo',
          bar: 'bar',
        },
      });

      await input.dispose();
      await addonFooPublic.dispose();
      await addonBarPublic.dispose();
      await output.dispose();
    });

    it('does not fail if app or add-ons have the same `public` folder structure', async function () {
      let input = await createTempDir();
      let addonFooPublic = await createTempDir();
      let addonBarPublic = await createTempDir();

      input.write({
        'crossdomain.xml': '',
        'robots.txt': '',
      });
      addonFooPublic.write({
        bar: 'bar',
        foo: 'foo',
      });
      addonBarPublic.write({
        bar: 'bar',
      });

      app = new EmberApp({
        project,
      });

      app.trees.public = input.path();
      app.addonTreesFor = function () {
        return [addonFooPublic.path(), addonBarPublic.path()];
      };

      let output = createBuilder(app.getPublic());
      await output.build();
      let outputFiles = output.read();

      expect(outputFiles).to.deep.equal({
        public: {
          'crossdomain.xml': '',
          'robots.txt': '',
          foo: 'foo',
          bar: 'bar',
        },
      });

      await input.dispose();
      await addonFooPublic.dispose();
      await addonBarPublic.dispose();
      await output.dispose();
    });
  });

  describe('getAddonTemplates()', function () {
    it('returns add-ons template files', async function () {
      let input = await createTempDir();
      let addonFooTemplates = await createTempDir();
      let addonBarTemplates = await createTempDir();

      addonFooTemplates.write({
        'foo.hbs': 'foo',
      });
      addonBarTemplates.write({
        'bar.hbs': 'bar',
      });

      let app = new EmberApp({
        project,
      });
      app.trees.templates = input.path();
      app.addonTreesFor = function () {
        return [addonFooTemplates.path(), addonBarTemplates.path()];
      };

      let output = createBuilder(app.getAddonTemplates());
      await output.build();
      let outputFiles = output.read();

      expect(outputFiles['test-project'].templates).to.deep.equal({
        'foo.hbs': 'foo',
        'bar.hbs': 'bar',
      });

      await input.dispose();
      await addonFooTemplates.dispose();
      await addonBarTemplates.dispose();
      await output.dispose();
    });
  });

  describe('getTests()', function () {
    it('returns all test files `hinting` is enabled', async function () {
      let input = await createTempDir();
      let addonLint = await createTempDir();
      let addonFooTestSupport = await createTempDir();
      let addonBarTestSupport = await createTempDir();

      input.write({
        acceptance: {
          'login-test.js': '',
          'logout-test.js': '',
        },
      });
      addonFooTestSupport.write({
        'foo-helper.js': 'foo',
      });
      addonBarTestSupport.write({
        'bar-helper.js': 'bar',
      });
      addonLint.write({
        'login-test.lint.js': '',
        'logout-test.lint.js': '',
      });

      let app = new EmberApp({
        project,
      });
      app.trees.tests = input.path();
      app.addonLintTree = (type, tree) => {
        if (type === 'tests') {
          return addonLint.path();
        }

        return tree;
      };
      app.addonTreesFor = function (type) {
        if (type === 'test-support') {
          return [addonFooTestSupport.path(), addonBarTestSupport.path()];
        }

        return [];
      };

      let output = createBuilder(app.getTests());
      await output.build();
      let outputFiles = output.read();

      expect(outputFiles.tests).to.deep.equal({
        'addon-test-support': {},
        lint: {
          'login-test.lint.js': '',
          'logout-test.lint.js': '',
        },
        acceptance: {
          'login-test.js': '',
          'logout-test.js': '',
        },
        'foo-helper.js': 'foo',
        'bar-helper.js': 'bar',
      });

      await input.dispose();
      await addonFooTestSupport.dispose();
      await addonBarTestSupport.dispose();
      await addonLint.dispose();
      await output.dispose();
    });

    it('returns test files w/o lint tests if `hinting` is disabled', async function () {
      let input = await createTempDir();
      let addonFooTestSupport = await createTempDir();
      let addonBarTestSupport = await createTempDir();

      input.write({
        acceptance: {
          'login-test.js': '',
          'logout-test.js': '',
        },
      });
      addonFooTestSupport.write({
        'foo-helper.js': 'foo',
      });
      addonBarTestSupport.write({
        'bar-helper.js': 'bar',
      });

      let app = new EmberApp({
        project,
        hinting: false,
      });
      app.trees.tests = input.path();
      app.addonTreesFor = function (type) {
        if (type === 'test-support') {
          return [addonFooTestSupport.path(), addonBarTestSupport.path()];
        }

        return [];
      };

      let output = createBuilder(app.getTests());
      await output.build();
      let outputFiles = output.read();

      expect(outputFiles.tests).to.deep.equal({
        'addon-test-support': {},
        acceptance: {
          'login-test.js': '',
          'logout-test.js': '',
        },
        'foo-helper.js': 'foo',
        'bar-helper.js': 'bar',
      });

      await input.dispose();
      await addonFooTestSupport.dispose();
      await addonBarTestSupport.dispose();
      await output.dispose();
    });
  });

  describe('constructor', function () {
    it('should override project.configPath if configPath option is specified', function () {
      project.configPath = function () {
        return 'original value';
      };

      let expected = 'custom config path';

      new EmberApp({
        project,
        configPath: expected,
      });

      expect(project.configPath().slice(-expected.length)).to.equal(expected);
    });

    it('should update project.config() if configPath option is specified', function () {
      project.require = function (path) {
        return () => ({ path });
      };

      expect(project.config('development')).to.deep.equal({});

      new EmberApp({
        project,
        configPath: path.join('..', '..', 'app-import', 'config', 'environment'),
      });

      expect(project.configPath()).to.contain(path.join('app-import', 'config', 'environment'));
    });

    it('should merge options with defaults to depth', function () {
      let app = new EmberApp(
        {
          project,
          foo: {
            bar: ['baz'],
          },
          fooz: {
            bam: {
              boo: ['default'],
            },
          },
        },
        {
          foo: {
            bar: ['bizz'],
          },
          fizz: 'fizz',
          fooz: {
            bam: {
              boo: ['custom'],
            },
          },
        }
      );

      expect(app.options.foo).to.deep.eql({
        bar: ['bizz'],
      });
      expect(app.options.fizz).to.eql('fizz');
      expect(app.options.fooz).to.eql({
        bam: {
          boo: ['custom'],
        },
      });
    });

    it('should do the right thing when merging default object options', function () {
      let app = new EmberApp(
        {
          project,
        },
        {
          minifyCSS: {
            enabled: true,
            options: {
              processImport: true,
            },
          },
        }
      );

      expect(app.options.minifyCSS).to.deep.equal({
        enabled: true,
        options: {
          processImport: true,
          relativeTo: 'assets',
        },
      });
    });

    it('should watch vendor if it exists', function () {
      let app = new EmberApp({
        project,
      });

      expect(app.options.trees.vendor.__broccoliGetInfo__()).to.have.property('watched', true);
    });

    describe('Addons included hook', function () {
      let includedWasCalled;
      let setupPreprocessorRegistryWasCalled;
      let addonsAppIncluded, addonsApp;
      let addon = {
        name: 'custom-addon',
        included() {
          includedWasCalled++;
          expect(setupPreprocessorRegistryWasCalled).to.eql(1);
          addonsAppIncluded = this.app;
        },

        setupPreprocessorRegistry() {
          expect(includedWasCalled).to.eql(0);
          setupPreprocessorRegistryWasCalled++;
          addonsApp = this.app;
        },
      };

      beforeEach(function () {
        setupPreprocessorRegistryWasCalled = includedWasCalled = 0;
        addonsApp = null;
        addonsAppIncluded = null;
        project.initializeAddons = function () {};
        project.addons = [EMBER_SOURCE_ADDON, addon];
      });

      it('should set the app on the addons', function () {
        expect(includedWasCalled).to.eql(0);
        let app = new EmberApp({
          project,
        });
        expect(includedWasCalled).to.eql(1);
        expect(setupPreprocessorRegistryWasCalled).to.eql(1);
        expect(addonsAppIncluded).to.eql(app);
        expect(addonsApp).to.eql(app);

        let addon = project.addons[0];
        expect(addon.app).to.deep.equal(app);
      });
    });

    describe('options.babel.sourceMaps', function () {
      it('disables babel sourcemaps by default', function () {
        let app = new EmberApp({
          project,
        });

        expect(app.options.babel.sourceMaps).to.be.false;
      });

      it('can enable babel sourcemaps with the option', function () {
        let app = new EmberApp({
          project,
          babel: {
            sourceMaps: 'inline',
          },
        });

        expect(app.options.babel.sourceMaps).to.equal('inline');
      });
    });

    describe('options.fingerprint.exclude', function () {
      it('excludeds testem in fingerprint exclude', function () {
        let app = new EmberApp({
          project,
          fingerprint: {
            exclude: [],
          },
        });

        expect(app.options.fingerprint.exclude).to.include('testem');
      });
    });
  });

  describe('addons', function () {
    describe('included hook', function () {
      it('included hook is called properly on instantiation', function () {
        let called = false;
        let passedApp;

        addon = {
          included(app) {
            called = true;
            passedApp = app;
          },
          treeFor() {},
        };

        project.initializeAddons = function () {
          this.addons = [EMBER_SOURCE_ADDON, addon];
        };

        let app = new EmberApp({
          project,
        });

        expect(called).to.be.true;
        expect(passedApp).to.equal(app);
      });

      it('does not throw an error if the addon does not implement `included`', function () {
        delete addon.included;

        project.initializeAddons = function () {
          this.addons = [EMBER_SOURCE_ADDON, addon];
        };

        expect(() => {
          new EmberApp({
            project,
          });
        }).to.not.throw(/addon must implement the `included`/);
      });
    });

    describe('addonTreesFor', function () {
      beforeEach(function () {
        addon = {
          included() {},
          treeFor() {},
        };

        project.initializeAddons = function () {
          this.addons = [EMBER_SOURCE_ADDON, addon];
        };

        app = new EmberApp({
          project,
        });
      });

      it('addonTreesFor returns an empty array if no addons return a tree', function () {
        expect(app.addonTreesFor('blah')).to.deep.equal([]);
      });

      it('addonTreesFor calls treesFor on the addon', function () {
        let sampleAddon = project.addons[0];
        let actualTreeName;

        sampleAddon.treeFor = function (name) {
          actualTreeName = name;

          return 'blazorz';
        };

        expect(app.addonTreesFor('blah')).to.deep.equal(['blazorz']);
        expect(actualTreeName).to.equal('blah');
      });

      it('addonTreesFor does not throw an error if treeFor is not defined', function () {
        delete addon.treeFor;

        app = new EmberApp({
          project,
        });

        expect(() => {
          app.addonTreesFor('blah');
        }).not.to.throw(/addon must implement the `treeFor`/);
      });

      describe('addonTreesFor is called properly', function () {
        beforeEach(function () {
          app = new EmberApp({
            project,
          });

          app.addonTreesFor = td.function();
          td.when(app.addonTreesFor(), { ignoreExtraArgs: true }).thenReturn(['batman']);
        });

        it('getAppJavascript calls addonTreesFor', function () {
          app.getAppJavascript();

          let args = td.explain(app.addonTreesFor).calls.map(function (call) {
            return call.args[0];
          });

          expect(args).to.deep.equal(['app']);
        });
      });
    });

    describe('toArray', function () {
      it('excludes `tests` tree from resulting array if the tree is not present', function () {
        app = new EmberApp({
          project,
          trees: {
            tests: null,
          },
        });

        app._defaultPackager.packageJavascript = td.function();
        app._defaultPackager.packageStyles = td.function();

        td.when(app._defaultPackager.packageJavascript(), { ignoreExtraArgs: true }).thenReturn('batman');
        td.when(app._defaultPackager.packageStyles(), { ignoreExtraArgs: true }).thenReturn('batman');

        app.toArray(); // doesn't throw an error
      });
    });

    describe('toTree', function () {
      beforeEach(function () {
        addon = {
          included() {},
          treeFor() {},
          postprocessTree: td.function(),
        };

        project.initializeAddons = function () {
          this.addons = [EMBER_SOURCE_ADDON, addon];
        };

        app = new EmberApp({
          project,
          tests: true,
          trees: { tests: {} },
        });
      });

      it('calls postProcessTree if defined', function () {
        app.toArray = td.function();
        app._legacyPackage = td.function();

        td.when(app.toArray(), { ignoreExtraArgs: true }).thenReturn([]);
        td.when(app._legacyPackage(), { ignoreExtraArgs: true }).thenReturn('bar');
        td.when(
          addon.postprocessTree(
            'all',
            td.matchers.argThat(
              (t) => t.constructor === BroccoliMergeTrees && t._inputNodes.length === 1 && t._inputNodes[0] === 'bar'
            )
          )
        ).thenReturn('derp');

        expect(app.toTree()).to.equal('derp');
      });

      it('calls addonPostprocessTree', function () {
        app.toArray = td.function();
        app.addonPostprocessTree = td.function();
        app._legacyPackage = td.function();

        td.when(app._legacyPackage(), { ignoreExtraArgs: true }).thenReturn('bar');
        td.when(app.toArray(), { ignoreExtraArgs: true }).thenReturn([]);
        td.when(
          app.addonPostprocessTree(
            'all',
            td.matchers.argThat(
              (t) => t.constructor === BroccoliMergeTrees && t._inputNodes.length === 1 && t._inputNodes[0] === 'bar'
            )
          )
        ).thenReturn('blap');

        expect(app.toTree()).to.equal('blap');
      });

      it('calls each addon postprocessTree hook', function () {
        mockTemplateRegistry(app);

        app.index = td.function();
        app.getTests = td.function();
        app._defaultPackager.processTemplates = td.function();

        td.when(app._defaultPackager.processTemplates(), { ignoreExtraArgs: true }).thenReturn('x');
        td.when(addon.postprocessTree(), { ignoreExtraArgs: true }).thenReturn('blap');
        td.when(app.index(), { ignoreExtraArgs: true }).thenReturn(null);
        td.when(app.getTests(), { ignoreExtraArgs: true }).thenReturn(null);

        expect(app.toTree()).to.equal('blap');

        let args = td.explain(addon.postprocessTree).calls.map(function (call) {
          return call.args[0];
        });

        expect(args).to.deep.equal(['js', 'css', 'test', 'all']);
      });
    });

    describe('addons can be disabled', function () {
      beforeEach(function () {
        projectPath = path.resolve(__dirname, '../../fixtures/addon/env-addons');
        const packageContents = require(path.join(projectPath, 'package.json'));
        let cli = new MockCLI();
        project = new (class extends Project {
          initializeAddons() {
            if (this._addonsInitialized) {
              return;
            }

            super.initializeAddons();

            this.addons.push(EMBER_SOURCE_ADDON);
          }
        })(projectPath, packageContents, cli.ui, cli);
      });

      afterEach(function () {
        process.env.EMBER_ENV = undefined;
      });

      describe('isEnabled is called properly', function () {
        describe('with environment', function () {
          let emberFooEnvAddonFixture;

          beforeEach(function () {
            emberFooEnvAddonFixture = require(path.resolve(projectPath, 'node_modules/ember-foo-env-addon/index.js'));
          });

          it('development', function () {
            process.env.EMBER_ENV = 'development';
            let app = new EmberApp({ project });

            emberFooEnvAddonFixture.app = app;
            expect(app._addonEnabled(emberFooEnvAddonFixture)).to.be.false;

            expect(app.project.addons.length).to.equal(9);
          });

          it('foo', function () {
            process.env.EMBER_ENV = 'foo';
            let app = new EmberApp({ project });

            emberFooEnvAddonFixture.app = app;
            expect(app._addonEnabled(emberFooEnvAddonFixture)).to.be.true;

            expect(app.project.addons.length).to.equal(10);
          });
        });
      });

      describe('exclude', function () {
        it('prevents addons to be added to the project', function () {
          process.env.EMBER_ENV = 'foo';

          let app = new EmberApp({
            project,
            addons: {
              exclude: ['ember-foo-env-addon'],
            },
          });

          expect(app._addonDisabledByExclude({ name: 'ember-foo-env-addon' })).to.be.true;
          expect(app._addonDisabledByExclude({ name: 'Ember Random Addon' })).to.be.false;
          expect(app.project.addons.length).to.equal(9);
        });

        it('throws if unavailable addon is specified', function () {
          function load() {
            process.env.EMBER_ENV = 'foo';

            new EmberApp({
              project,
              addons: {
                exclude: ['ember-cli-self-troll'],
              },
            });
          }

          expect(load).to.throw('Addon "ember-cli-self-troll" defined in "exclude" is not found');
        });
      });

      describe('include', function () {
        it('prevents non-included addons to be added to the project', function () {
          process.env.EMBER_ENV = 'foo';

          let app = new EmberApp({
            project,
            addons: {
              include: ['ember-foo-env-addon'],
            },
          });

          expect(app._addonDisabledByInclude({ name: 'ember-foo-env-addon' })).to.be.false;
          expect(app._addonDisabledByInclude({ name: 'Ember Random Addon' })).to.be.true;
          expect(app.project.addons.length).to.equal(1);
        });

        it('throws if unavailable addon is specified', function () {
          function load() {
            process.env.EMBER_ENV = 'foo';

            new EmberApp({
              project,
              addons: {
                include: ['ember-cli-self-troll'],
              },
            });
          }

          expect(load).to.throw('Addon "ember-cli-self-troll" defined in "include" is not found');
        });
      });

      describe('exclude wins over include', function () {
        it('prevents addon to be added to the project', function () {
          process.env.EMBER_ENV = 'foo';

          let app = new EmberApp({
            project,
            addons: {
              include: ['ember-foo-env-addon'],
              exclude: ['ember-foo-env-addon'],
            },
          });

          expect(app.project.addons.length).to.equal(0);
        });
      });
    });

    describe('addon instance bundle caching validation (when used within the project)', function () {
      let fixturifyProject;

      beforeEach(function () {
        fixturifyProject = new FixturifyProject('awesome-proj', '1.0.0');
        fixturifyProject.addDevDependency('ember-cli', '*');
      });

      afterEach(function () {
        fixturifyProject.dispose();
      });

      it('throws an error if an addon `include` is specified', function () {
        fixturifyProject.addInRepoAddon('foo', '1.0.0', { allowCachingPerBundle: true });
        fixturifyProject.addInRepoAddon('foo-bar', '1.0.0', {
          callback: (inRepoAddon) => {
            inRepoAddon.pkg['ember-addon'].paths = ['../foo'];
          },
        });

        fixturifyProject.writeSync();

        let projectWithBundleCaching = fixturifyProject.buildProjectModel();
        projectWithBundleCaching.initializeAddons();
        projectWithBundleCaching.addons.push(EMBER_SOURCE_ADDON);

        expect(() => {
          new EmberApp({
            project: projectWithBundleCaching,
            addons: {
              include: ['foo'],
            },
          });
        }).to.throw(
          [
            '[ember-cli] addon bundle caching is disabled for apps that specify an addon "include"',
            '',
            'All addons using bundle caching:',
            projectWithBundleCaching.addons.find((addon) => addon.name === 'foo').packageRoot,
          ].join('\n')
        );
      });

      it('throws an error if an addon `exclude` is specified', function () {
        fixturifyProject.addInRepoAddon('foo', '1.0.0', { allowCachingPerBundle: true });
        fixturifyProject.addInRepoAddon('foo-bar', '1.0.0', {
          callback: (inRepoAddon) => {
            inRepoAddon.pkg['ember-addon'].paths = ['../foo'];
          },
        });

        fixturifyProject.writeSync();

        let projectWithBundleCaching = fixturifyProject.buildProjectModel();
        projectWithBundleCaching.initializeAddons();
        projectWithBundleCaching.addons.push(EMBER_SOURCE_ADDON);

        expect(() => {
          new EmberApp({
            project: projectWithBundleCaching,
            addons: {
              exclude: ['foo'],
            },
          });
        }).to.throw(
          [
            '[ember-cli] addon bundle caching is disabled for apps that specify an addon "exclude"',
            '',
            'All addons using bundle caching:',
            projectWithBundleCaching.addons.find((addon) => addon.name === 'foo').packageRoot,
          ].join('\n')
        );
      });
    });

    describe('addonLintTree', function () {
      beforeEach(function () {
        addon = {
          lintTree: td.function(),
        };

        project.initializeAddons = function () {
          this.addons = [EMBER_SOURCE_ADDON, addon];
        };

        app = new EmberApp({
          project,
        });
      });

      it('does not throw an error if lintTree is not defined', function () {
        app.addonLintTree();
      });

      it('calls lintTree on the addon', function () {
        app.addonLintTree('blah', 'blam');

        td.verify(addon.lintTree('blah', 'blam'));
      });
    });
  });

  describe('import', function () {
    beforeEach(function () {
      app = new EmberApp({
        project,
      });
    });

    afterEach(function () {
      process.env.EMBER_ENV = undefined;
    });

    it('appends dependencies to vendor by default', function () {
      app.import('vendor/moment.js');
      let outputFile = app._scriptOutputFiles['/assets/vendor.js'];

      expect(outputFile).to.be.instanceof(Array);
      expect(outputFile.indexOf('vendor/moment.js')).to.equal(outputFile.length - 1);
    });
    it('appends dependencies', function () {
      app.import('vendor/moment.js', { type: 'vendor' });

      let outputFile = app._scriptOutputFiles['/assets/vendor.js'];

      expect(outputFile).to.be.instanceof(Array);
      expect(outputFile.indexOf('vendor/moment.js')).to.equal(outputFile.length - 1);
    });

    it('prepends dependencies', function () {
      app.import('vendor/es5-shim.js', { type: 'vendor', prepend: true });

      let outputFile = app._scriptOutputFiles['/assets/vendor.js'];

      expect(outputFile).to.be.instanceof(Array);
      expect(outputFile.indexOf('vendor/es5-shim.js')).to.equal(0);
    });

    it('prepends dependencies to outputFile', function () {
      app.import('vendor/moment.js', { outputFile: 'moment.js', prepend: true });

      let outputFile = app._scriptOutputFiles['moment.js'];

      expect(outputFile).to.be.instanceof(Array);
      expect(outputFile.indexOf('vendor/moment.js')).to.equal(0);
    });

    it('appends dependencies to outputFile', function () {
      app.import('vendor/moment.js', { outputFile: 'moment.js' });

      let outputFile = app._scriptOutputFiles['moment.js'];

      expect(outputFile).to.be.instanceof(Array);
      expect(outputFile.indexOf('vendor/moment.js')).to.equal(outputFile.length - 1);
    });

    it('defaults to development if production is not set', function () {
      process.env.EMBER_ENV = 'production';
      app.import({
        development: 'vendor/jquery.js',
      });

      let outputFile = app._scriptOutputFiles['/assets/vendor.js'];
      expect(outputFile.indexOf('vendor/jquery.js')).to.equal(outputFile.length - 1);
    });

    it('honors explicitly set to null in environment', function () {
      process.env.EMBER_ENV = 'production';
      // set EMBER_ENV before creating the project

      app = new EmberApp({
        project,
      });

      app.import({
        development: 'vendor/jquery.js',
        production: null,
      });

      expect(app._scriptOutputFiles['/assets/vendor.js']).to.not.contain('vendor/jquery.js');
    });

    it('normalizes asset path correctly', function () {
      app.import('vendor\\path\\to\\lib.js', { type: 'vendor' });
      app.import('vendor/path/to/lib2.js', { type: 'vendor' });

      expect(app._scriptOutputFiles['/assets/vendor.js']).to.contain('vendor/path/to/lib.js');
      expect(app._scriptOutputFiles['/assets/vendor.js']).to.contain('vendor/path/to/lib2.js');
    });

    it('option.using throws exception given invalid inputs', function () {
      // `using` is looped over if given, we should ensure this throws an exception with proper error message
      expect(() => {
        app.import('vendor/path/to/lib1.js', { using: 1 });
      }).to.throw(/You must pass an array of transformations for `using` option/);

      expect(() => {
        app.import('vendor/path/to/lib2.js', { using: 'foop' });
      }).to.throw(/You must pass an array of transformations for `using` option/);

      expect(() => {
        app.import('vendor/path/to/lib3.js', { using: [1] });
      }).to.throw(/list must have a `transformation` name/);

      expect(() => {
        app.import('vendor/path/to/lib3.js', { using: [{ foo: 'bar' }] });
      }).to.throw(/list must have a `transformation` name/);
    });
  });

  describe('vendorFiles', function () {
    let defaultVendorFiles = ['ember.js', 'ember-testing.js'];

    it('defines vendorFiles by default', function () {
      app = new EmberApp({
        project,
      });
      expect(Object.keys(app.vendorFiles)).to.deep.equal(defaultVendorFiles);
    });

    it('redefines a location of a vendor asset', function () {
      app = new EmberApp({
        project,

        vendorFiles: {
          'ember.js': 'vendor/ember.js',
        },
      });
      expect(app.vendorFiles['ember.js']).to.equal('vendor/ember.js');
    });

    it('defines vendorFiles in order even when option for it is passed', function () {
      app = new EmberApp({
        project,

        vendorFiles: {
          'ember.js': 'vendor/ember.js',
        },
      });
      expect(Object.keys(app.vendorFiles)).to.deep.equal(defaultVendorFiles);
    });

    it('removes dependency in vendorFiles', function () {
      app = new EmberApp({
        project,

        vendorFiles: {
          'ember.js': null,
        },
      });
      let vendorFiles = Object.keys(app.vendorFiles);
      expect(vendorFiles).to.not.contain('ember.js');
    });

    it('does not clobber an explicitly configured ember development file', function () {
      app = new EmberApp({
        project,

        vendorFiles: {
          'ember.js': {
            development: 'vendor/ember.debug.js',
          },
        },
      });
      let files = app.vendorFiles['ember.js'];
      expect(files.development).to.equal('vendor/ember.debug.js');
    });
  });

  it('fails with invalid type', function () {
    let app = new EmberApp({
      project,
    });

    expect(() => {
      app.import('vendor/b/c/foo.js', { type: 'javascript' });
    }).to.throw(
      /You must pass either `vendor` or `test` for options.type in your call to `app.import` for file: foo.js/
    );
  });

  describe('_initOptions', function () {
    it('sets the tests directory as watched when tests are enabled', function () {
      let app = new EmberApp({
        project,
      });

      app._initOptions({
        tests: true,
      });

      expect(app.options.trees.tests).to.be.an.instanceOf(WatchedDir);
    });
    it('sets the tests directory as unwatched when tests are disabled', function () {
      let app = new EmberApp({
        project,
      });

      app._initOptions({
        tests: false,
      });

      expect(app.options.trees.tests).to.be.an.instanceOf(UnwatchedDir);
    });
  });

  describe('_resolveLocal', function () {
    it('resolves a path relative to the project root', function () {
      let app = new EmberApp({
        project,
      });

      let result = app._resolveLocal('foo');
      expect(result).to.equal(path.join(project.root, 'foo'));
    });
  });

  describe('_concatFiles()', function () {
    beforeEach(function () {
      app = new EmberApp({ project });
    });

    describe('concat order', function () {
      beforeEach(function () {
        mockTemplateRegistry(app);
      });

      it('correctly orders concats from app.styles()', function () {
        app.import('files/b.css');
        app.import('files/c.css');
        app.import('files/a.css', { prepend: true });
        app.import('files/d.css');

        expect(app._styleOutputFiles['/assets/vendor.css']).to.deep.equal([
          'files/a.css',
          'files/b.css',
          'files/c.css',
          'files/d.css',
        ]);
      });

      it('correctly orders concats from app.testFiles()', function () {
        app.import('files/b.js', { type: 'test' });
        app.import('files/c.js', { type: 'test' });
        app.import('files/a.js', { type: 'test' });
        app.import('files/a.js', { type: 'test', prepend: true }); // Should end up second.
        app.import('files/d.js', { type: 'test' });
        app.import('files/d.js', { type: 'test', prepend: true }); // Should end up first.
        app.import('files/d.js', { type: 'test' });

        app.import('files/b.css', { type: 'test' });
        app.import('files/c.css', { type: 'test' });
        app.import('files/a.css', { type: 'test', prepend: true });
        app.import('files/d.css', { type: 'test' });
        app.import('files/d.css', { type: 'test' });

        expect(app.legacyTestFilesToAppend).to.deep.equal([
          'files/d.js',
          'files/a.js',
          'vendor/ember/ember-testing.js',
          'files/b.js',
          'files/c.js',
        ]);

        expect(app.vendorTestStaticStyles).to.deep.equal(['files/a.css', 'files/b.css', 'files/c.css', 'files/d.css']);
      });
    });
  });
});
