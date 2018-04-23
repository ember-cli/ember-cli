/* global escape */

'use strict';

const co = require('co');
const path = require('path');
const Project = require('../../../lib/models/project');
const expect = require('chai').expect;
const td = require('testdouble');
const broccoliTestHelper = require('broccoli-test-helper');

const buildOutput = broccoliTestHelper.buildOutput;
const createTempDir = broccoliTestHelper.createTempDir;

const MockCLI = require('../../helpers/mock-cli');

let EmberApp = require('../../../lib/broccoli/ember-app');

function mockTemplateRegistry(app) {
  let oldLoad = app.registry.load;
  app.registry.load = function(type) {
    if (type === 'template') {
      return [
        {
          toTree() {
            return {
              description: 'template',
            };
          },
        },
      ];
    }
    return oldLoad.apply(app.registry, arguments);
  };

}
describe('EmberApp', function() {
  let project, projectPath, app, addon;

  function setupProject(rootPath) {
    const packageContents = require(path.join(rootPath, 'package.json'));
    let cli = new MockCLI();

    project = new Project(rootPath, packageContents, cli.ui, cli);
    project.require = function() {
      return function() {};
    };
    project.initializeAddons = function() {
      this.addons = [];
    };

    return project;
  }

  beforeEach(function() {
    projectPath = path.resolve(__dirname, '../../fixtures/addon/simple');
    project = setupProject(projectPath);
  });

  describe('getTemplates()', function() {
    it('returns application and add-ons template files', co.wrap(function *() {
      let input = yield createTempDir();
      let addonFooTemplates = yield createTempDir();
      let addonBarTemplates = yield createTempDir();

      input.write({
        'application.hbs': '',
        'error.hbs': '',
        'loading.hbs': '',
      });
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
      app.addonTreesFor = function() {
        return [
          addonFooTemplates.path(),
          addonBarTemplates.path(),
        ];
      };

      let output = yield buildOutput(app.getTemplates());
      let outputFiles = output.read();

      expect(outputFiles['test-project'].templates).to.deep.equal({
        'application.hbs': '',
        'error.hbs': '',
        'loading.hbs': '',
        'foo.hbs': 'foo',
        'bar.hbs': 'bar',
      });

      yield input.dispose();
      yield addonFooTemplates.dispose();
      yield addonBarTemplates.dispose();
      yield output.dispose();
    }));
  });

  describe('constructor', function() {
    it('should override project.configPath if configPath option is specified', function() {
      project.configPath = function() { return 'original value'; };

      let expected = 'custom config path';

      new EmberApp({
        project,
        configPath: expected,
      });

      expect(project.configPath().slice(-expected.length)).to.equal(expected);
    });

    it('should set bowerDirectory for app', function() {
      let app = new EmberApp({
        project,
      });

      expect(app.bowerDirectory).to.equal(project.bowerDirectory);
      expect(app.bowerDirectory).to.equal('bower_components');
    });

    it('should merge options with defaults to depth', function() {
      let app = new EmberApp({
        project,
        foo: {
          bar: ['baz'],
        },
        fooz: {
          bam: {
            boo: ['default'],
          },
        },
      }, {
        foo: {
          bar: ['bizz'],
        },
        fizz: 'fizz',
        fooz: {
          bam: {
            boo: ['custom'],
          },
        },
      });

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

    it('should do the right thing when merging default object options', function() {
      let app = new EmberApp({
        project,
      }, {
        minifyJS: {
          enabled: true,
          options: {
            exclusions: ['hey', 'you'],
          },
        },
      });

      expect(app.options.minifyJS).to.deep.equal({
        enabled: true,
        options: {
          exclusions: ['hey', 'you'],
          compress: {
            'negate_iife': false,
            sequences: 30,
          },
          output: {
            semicolons: false,
          },
        },
      });
    });

    it('should watch vendor if it exists', function() {
      let app = new EmberApp({
        project,
      });

      expect(app.options.trees.vendor.__broccoliGetInfo__()).to.have.property('watched', true);
    });

    describe('Addons included hook', function() {
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

      beforeEach(function() {
        setupPreprocessorRegistryWasCalled = includedWasCalled = 0;
        addonsApp = null;
        addonsAppIncluded = null;
        project.initializeAddons = function() { };
        project.addons = [addon];
      });

      it('should set the app on the addons', function() {
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

    describe('loader.js missing', function() {
      it('does not error when loader.js is present in registry.availablePlugins', function() {
        expect(() => {
          new EmberApp({
            project,
          });
        }).to.not.throw(/loader.js addon is missing/);
      });

      it('throws an error when loader.js is not present in registry.availablePlugins', function() {
        expect(() => {
          new EmberApp({
            project,
            registry: {
              add() { },
              availablePlugins: { },
            },
          });
        }).to.throw(/loader.js addon is missing/);
      });

      it('does not throw an error if _ignoreMissingLoader is set', function() {
        expect(() => {
          new EmberApp({
            project,
            registry: {
              add() { },
              availablePlugins: { },
            },
            _ignoreMissingLoader: true,
          });
        }).to.not.throw(/loader.js addon is missing/);
      });
    });

    describe('ember-resolver npm vs Bower', function() {
      it('does not load ember-resolver.js as bower dep when ember-resolver is present in registry.availablePlugins', function() {
        let app = new EmberApp({ project });
        expect(app.vendorFiles['ember-resolver']).to.equal(undefined);
      });

      it('keeps ember-resolver.js in vendorFiles when npm ember-resolver is not installed, but is present in bower.json', function() {
        project.bowerDependencies = function() { return { 'ember': {}, 'ember-resolver': {} }; };
        let app = new EmberApp({
          project,
          registry: {
            add() { },
            availablePlugins: { 'loader.js': {} },
          },
        });
        expect(app.vendorFiles['ember-resolver.js'][0]).to.equal('bower_components/ember-resolver/dist/modules/ember-resolver.js');
      });

      it('removes ember-resolver.js from vendorFiles when not in bower.json and npm ember-resolver not installed', function() {
        project.bowerDependencies = function() { return { 'ember': {} }; };
        let app = new EmberApp({
          project,
          registry: {
            add() { },
            availablePlugins: { 'loader.js': {} },
          },
        });

        expect(app.vendorFiles['ember-resolver']).to.equal(undefined);
      });
    });

    describe('options.babel.sourceMaps', function() {
      it('disables babel sourcemaps by default', function() {
        let app = new EmberApp({
          project,
        });

        expect(app.options.babel.sourceMaps).to.be.false;
      });

      it('can enable babel sourcemaps with the option', function() {
        let app = new EmberApp({
          project,
          babel: {
            sourceMaps: 'inline',
          },
        });

        expect(app.options.babel.sourceMaps).to.equal('inline');
      });
    });
  });

  describe('addons', function() {
    describe('included hook', function() {
      it('included hook is called properly on instantiation', function() {
        let called = false;
        let passedApp;

        addon = {
          included(app) { called = true; passedApp = app; },
          treeFor() { },
        };

        project.initializeAddons = function() {
          this.addons = [addon];
        };

        let app = new EmberApp({
          project,
        });

        expect(called).to.be.true;
        expect(passedApp).to.equal(app);
      });

      it('does not throw an error if the addon does not implement `included`', function() {
        delete addon.included;

        project.initializeAddons = function() {
          this.addons = [addon];
        };

        expect(() => {
          new EmberApp({
            project,
          });
        }).to.not.throw(/addon must implement the `included`/);
      });
    });

    describe('addonTreesFor', function() {
      beforeEach(function() {
        addon = {
          included() { },
          treeFor() { },
        };

        project.initializeAddons = function() {
          this.addons = [addon];
        };

        app = new EmberApp({
          project,
        });
      });

      it('addonTreesFor returns an empty array if no addons return a tree', function() {
        expect(app.addonTreesFor('blah')).to.deep.equal([]);
      });

      it('addonTreesFor calls treesFor on the addon', function() {
        let sampleAddon = project.addons[0];
        let actualTreeName;

        sampleAddon.treeFor = function(name) {
          actualTreeName = name;

          return 'blazorz';
        };

        expect(app.addonTreesFor('blah')).to.deep.equal(['blazorz']);
        expect(actualTreeName).to.equal('blah');
      });

      it('addonTreesFor does not throw an error if treeFor is not defined', function() {
        delete addon.treeFor;

        app = new EmberApp({
          project,
        });

        expect(() => {
          app.addonTreesFor('blah');
        }).not.to.throw(/addon must implement the `treeFor`/);
      });

      describe('addonTreesFor is called properly', function() {
        beforeEach(function() {
          app = new EmberApp({
            project,
          });

          app.addonTreesFor = td.function();
          td.when(app.addonTreesFor(), { ignoreExtraArgs: true }).thenReturn(['batman']);
        });

        it('_processedAppTree calls addonTreesFor', function() {
          app._processedAppTree();

          let args = td.explain(app.addonTreesFor).calls.map(function(call) { return call.args[0]; });

          expect(args).to.deep.equal(['app']);
        });
      });
    });

    describe('default vendor/vendor.css exists', function() {
      beforeEach(function() {
        app = new EmberApp({
          project,
        });

        mockTemplateRegistry(app);
      });

      it('has default vendor.css', function() {
        let styles = app.styles()._inputNodes.map(String);

        expect(styles.length).to.eql(2);
        expect(styles[0]).to.match(/Funnel/);
        expect(styles[1]).to.match(/assets\/vendor.css/);
      });
    });

    describe('postprocessTree is called properly', function() {
      beforeEach(function() {
        app = new EmberApp({
          project,
        });

        app.addonPostprocessTree = td.function();
        td.when(app.addonPostprocessTree(), { ignoreExtraArgs: true }).thenReturn(['batman']);

        mockTemplateRegistry(app);
      });

      it('from .styles()', function() {
        let stylesOutput = app.styles();

        expect(stylesOutput).to.eql(['batman']);
      });
    });

    describe('toTree', function() {
      beforeEach(function() {
        addon = {
          included() { },
          treeFor() { },
          postprocessTree: td.function(),
        };

        project.initializeAddons = function() {
          this.addons = [addon];
        };

        app = new EmberApp({
          project,
        });
      });

      it('calls postProcessTree if defined', function() {
        app.toArray = td.function();

        td.when(app.toArray(), { ignoreExtraArgs: true }).thenReturn([]);
        td.when(addon.postprocessTree(), { ignoreExtraArgs: true }).thenReturn('derp');

        expect(app.toTree()).to.equal('derp');
      });

      it('calls addonPostprocessTree', function() {
        app.toArray = td.function();
        app.addonPostprocessTree = td.function();

        td.when(app.toArray(), { ignoreExtraArgs: true }).thenReturn([]);
        td.when(app.addonPostprocessTree(), { ignoreExtraArgs: true }).thenReturn('blap');

        expect(app.toTree()).to.equal('blap');
      });

      it('calls each addon postprocessTree hook', function() {
        mockTemplateRegistry(app);

        app.index = td.function();
        app._defaultPackager.processTemplates = td.function();

        td.when(app._defaultPackager.processTemplates(), { ignoreExtraArgs: true }).thenReturn('x');
        td.when(addon.postprocessTree(), { ignoreExtraArgs: true }).thenReturn('blap');
        td.when(app.index(), { ignoreExtraArgs: true }).thenReturn(null);

        expect(app.toTree()).to.equal('blap');

        let args = td.explain(addon.postprocessTree).calls.map(function(call) { return call.args[0]; });

        expect(args).to.deep.equal(['js', 'css', 'test', 'all']);
      });
    });

    describe('addons can be disabled', function() {
      beforeEach(function() {
        projectPath = path.resolve(__dirname, '../../fixtures/addon/env-addons');
        const packageContents = require(path.join(projectPath, 'package.json'));
        let cli = new MockCLI();
        project = new Project(projectPath, packageContents, cli.ui, cli);
        let discoverFromCli = td.replace(project.addonDiscovery, 'discoverFromCli');
        td.when(discoverFromCli(), { ignoreExtraArgs: true }).thenReturn([]);
      });

      afterEach(function() {
        process.env.EMBER_ENV = undefined;
      });

      describe('isEnabled is called properly', function() {
        describe('with environment', function() {
          let emberFooEnvAddonFixture;

          beforeEach(function() {
            emberFooEnvAddonFixture = require(path.resolve(projectPath, 'node_modules/ember-foo-env-addon/index.js'));
          });

          it('development', function() {
            process.env.EMBER_ENV = 'development';
            let app = new EmberApp({ project });

            emberFooEnvAddonFixture.app = app;
            expect(app._addonEnabled(emberFooEnvAddonFixture)).to.be.false;

            expect(app.project.addons.length).to.equal(8);
          });

          it('foo', function() {
            process.env.EMBER_ENV = 'foo';
            let app = new EmberApp({ project });

            emberFooEnvAddonFixture.app = app;
            expect(app._addonEnabled(emberFooEnvAddonFixture)).to.be.true;

            expect(app.project.addons.length).to.equal(9);
          });
        });
      });

      describe('blacklist', function() {
        it('prevents addons to be added to the project', function() {
          process.env.EMBER_ENV = 'foo';

          let app = new EmberApp({
            project,
            addons: {
              blacklist: ['ember-foo-env-addon'],
            },
          });

          expect(app._addonDisabledByBlacklist({ name: 'ember-foo-env-addon' })).to.be.true;
          expect(app._addonDisabledByBlacklist({ name: 'Ember Random Addon' })).to.be.false;
          expect(app.project.addons.length).to.equal(8);
        });

        it('throws if unavailable addon is specified', function() {
          function load() {
            process.env.EMBER_ENV = 'foo';

            new EmberApp({
              project,
              addons: {
                blacklist: ['ember-cli-self-troll'],
              },
            });
          }

          expect(load).to.throw('Addon "ember-cli-self-troll" defined in blacklist is not found');
        });
      });

      describe('whitelist', function() {
        it('prevents non-whitelisted addons to be added to the project', function() {
          process.env.EMBER_ENV = 'foo';

          let app = new EmberApp({
            project,
            addons: {
              whitelist: ['ember-foo-env-addon'],
            },
          });

          expect(app._addonDisabledByWhitelist({ name: 'ember-foo-env-addon' })).to.be.false;
          expect(app._addonDisabledByWhitelist({ name: 'Ember Random Addon' })).to.be.true;
          expect(app.project.addons.length).to.equal(1);
        });

        it('throws if unavailable addon is specified', function() {
          function load() {
            process.env.EMBER_ENV = 'foo';
            app = new EmberApp({
              project,
              addons: {
                whitelist: ['ember-cli-self-troll'],
              },
            });
          }

          expect(load).to.throw('Addon "ember-cli-self-troll" defined in whitelist is not found');
        });
      });

      describe('blacklist wins over whitelist', function() {
        it('prevents addon to be added to the project', function() {
          process.env.EMBER_ENV = 'foo';
          app = new EmberApp({
            project,
            addons: {
              whitelist: ['ember-foo-env-addon'],
              blacklist: ['ember-foo-env-addon'],
            },
          });

          expect(app.project.addons.length).to.equal(0);
        });
      });
    });

    describe('addonLintTree', function() {
      beforeEach(function() {
        addon = {
          lintTree: td.function(),
        };

        project.initializeAddons = function() {
          this.addons = [addon];
        };

        app = new EmberApp({
          project,
        });
      });

      it('does not throw an error if lintTree is not defined', function() {
        app.addonLintTree();
      });

      it('calls lintTree on the addon', function() {
        app.addonLintTree('blah', 'blam');

        td.verify(addon.lintTree('blah', 'blam'));
      });
    });
  });

  describe('import', function() {
    beforeEach(function() {
      app = new EmberApp({
        project,
      });
    });

    afterEach(function() {
      process.env.EMBER_ENV = undefined;
    });

    it('appends dependencies to vendor by default', function() {
      app.import('vendor/moment.js');
      let outputFile = app._scriptOutputFiles['/assets/vendor.js'];

      expect(outputFile).to.be.instanceof(Array);
      expect(outputFile.indexOf('vendor/moment.js')).to.equal(outputFile.length - 1);
    });
    it('appends dependencies', function() {
      app.import('vendor/moment.js', { type: 'vendor' });

      let outputFile = app._scriptOutputFiles['/assets/vendor.js'];

      expect(outputFile).to.be.instanceof(Array);
      expect(outputFile.indexOf('vendor/moment.js')).to.equal(outputFile.length - 1);
    });

    it('prepends dependencies', function() {
      app.import('vendor/es5-shim.js', { type: 'vendor', prepend: true });

      let outputFile = app._scriptOutputFiles['/assets/vendor.js'];

      expect(outputFile).to.be.instanceof(Array);
      expect(outputFile.indexOf('vendor/es5-shim.js')).to.equal(0);
    });

    it('prepends dependencies to outputFile', function() {
      app.import('vendor/moment.js', { outputFile: 'moment.js', prepend: true });

      let outputFile = app._scriptOutputFiles['moment.js'];

      expect(outputFile).to.be.instanceof(Array);
      expect(outputFile.indexOf('vendor/moment.js')).to.equal(0);
    });

    it('appends dependencies to outputFile', function() {
      app.import('vendor/moment.js', { outputFile: 'moment.js' });

      let outputFile = app._scriptOutputFiles['moment.js'];

      expect(outputFile).to.be.instanceof(Array);
      expect(outputFile.indexOf('vendor/moment.js')).to.equal(outputFile.length - 1);
    });

    it('defaults to development if production is not set', function() {
      process.env.EMBER_ENV = 'production';
      app.import({
        'development': 'vendor/jquery.js',
      });

      let outputFile = app._scriptOutputFiles['/assets/vendor.js'];
      expect(outputFile.indexOf('vendor/jquery.js')).to.equal(outputFile.length - 1);
    });

    it('honors explicitly set to null in environment', function() {
      process.env.EMBER_ENV = 'production';
      // set EMBER_ENV before creating the project

      app = new EmberApp({
        project,
      });

      app.import({
        'development': 'vendor/jquery.js',
        'production': null,
      });

      expect(app._scriptOutputFiles['/assets/vendor.js']).to.not.contain('vendor/jquery.js');
    });

    it('normalizes asset path correctly', function() {
      app.import('vendor\\path\\to\\lib.js', { type: 'vendor' });
      app.import('vendor/path/to/lib2.js', { type: 'vendor' });

      expect(app._scriptOutputFiles['/assets/vendor.js']).to.contain('vendor/path/to/lib.js');
      expect(app._scriptOutputFiles['/assets/vendor.js']).to.contain('vendor/path/to/lib2.js');
    });

    it('option.using throws exception given invalid inputs', function() {
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

  describe('vendorFiles', function() {
    let defaultVendorFiles = [
      'jquery.js',
      'ember.js',
      'app-shims.js',
    ];

    describe('handlebars.js', function() {
      it('does not app.import handlebars if not present in bower.json', function() {
        let app = new EmberApp({
          project,
        });

        expect(app.vendorFiles).not.to.include.keys('handlebars.js');
      });

      it('includes handlebars if present in bower.json', function() {
        projectPath = path.resolve(__dirname, '../../fixtures/project-with-handlebars');
        project = setupProject(projectPath);

        let app = new EmberApp({
          project,
        });

        expect(app.vendorFiles).to.include.keys('handlebars.js');
      });

      it('includes handlebars if present in provided `vendorFiles`', function() {
        let app = new EmberApp({
          project,
          vendorFiles: {
            'handlebars.js': 'some/path/whatever.js',
          },
        });

        expect(app.vendorFiles).to.include.keys('handlebars.js');
      });
    });

    it('defines vendorFiles by default', function() {
      app = new EmberApp({
        project,
      });
      expect(Object.keys(app.vendorFiles)).to.deep.equal(defaultVendorFiles);
    });

    it('redefines a location of a vendor asset', function() {
      app = new EmberApp({
        project,

        vendorFiles: {
          'ember.js': 'vendor/ember.js',
        },
      });
      expect(app.vendorFiles['ember.js']).to.equal('vendor/ember.js');
    });

    it('defines vendorFiles in order even when option for it is passed', function() {
      app = new EmberApp({
        project,

        vendorFiles: {
          'ember.js': 'vendor/ember.js',
        },
      });
      expect(Object.keys(app.vendorFiles)).to.deep.equal(defaultVendorFiles);
    });

    it('removes dependency in vendorFiles', function() {
      app = new EmberApp({
        project,

        vendorFiles: {
          'ember.js': null,
          'handlebars.js': null,
        },
      });
      let vendorFiles = Object.keys(app.vendorFiles);
      expect(vendorFiles).to.not.contain('ember.js');
      expect(vendorFiles).to.not.contain('handlebars.js');
    });

    it('defaults to ember.debug.js if exists in bower_components', function() {
      let root = path.resolve(__dirname, '../../fixtures/app/with-default-ember-debug');

      app = new EmberApp({
        project: setupProject(root),
      });

      let files = app.vendorFiles['ember.js'];
      expect(files.development).to.equal('bower_components/ember/ember.debug.js');
    });

    it('switches the default ember.debug.js to ember.js if it does not exist', function() {
      let root = path.resolve(__dirname, '../../fixtures/app/without-ember-debug');

      app = new EmberApp({
        project: setupProject(root),
      });

      let files = app.vendorFiles['ember.js'];
      expect(files.development).to.equal('bower_components/ember/ember.js');
    });

    it('does not clobber an explicitly configured ember development file', function() {
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

  it('fails with invalid type', function() {
    let app = new EmberApp({
      project,
    });

    expect(() => {
      app.import('vendor/b/c/foo.js', { type: 'javascript' });
    }).to.throw(/You must pass either `vendor` or `test` for options.type in your call to `app.import` for file: foo.js/);
  });

  describe('_resolveLocal', function() {
    it('resolves a path relative to the project root', function() {
      let app = new EmberApp({
        project,
      });

      let result = app._resolveLocal('foo');
      expect(result).to.equal(path.join(project.root, 'foo'));
    });
  });

  describe('_concatFiles()', function() {
    beforeEach(function() {
      app = new EmberApp({ project });
    });

    describe('concat order', function() {
      let count = 0;
      let args = [];

      beforeEach(function() {
        count = 0;
        args = [];

        // we are "spying and mocking here" so to ensure we are testing our own
        // "wiring" not the implementation of our dependencies e.g. broccoli-concat
        app._concatFiles = function(tree, options) {
          count++;
          args.push(options);
          return tree;
        };

        app.appAndDependencies = function() {
          return 'app-and-dependencies-tree';
        };

        mockTemplateRegistry(app);
      });

      it('prevents duplicate inclusion, maintains order: CSS', function() {
        app.import('files/a.css');
        app.import('files/e.css'); // should be omitted.
        app.import('files/b.css');
        app.import('files/c.css');
        app.import('files/d.css');
        app.import('files/c.css', { prepend: true }); // should be omitted.
        app.import('files/e.css');

        app.styles(); // run

        expect(count).to.eql(1);

        expect(args[0]).to.deep.eql({
          annotation: 'Concat: Vendor Styles/assets/vendor.css',
          allowNone: true,
          headerFiles: [
            'files/a.css',
            'files/b.css',
            'files/c.css',
            'files/d.css',
            'files/e.css',
          ],
          inputFiles: ['addon-tree-output/**/*.css'],
          outputFile: '/assets/vendor.css',
        });
      });

      it('correctly orders concats from app.styles()', function() {
        app.import('files/b.css');
        app.import('files/c.css');
        app.import('files/a.css', { prepend: true });
        app.import('files/d.css');

        app.styles(); // run

        expect(count).to.eql(1);

        expect(args[0]).to.deep.eql({
          annotation: 'Concat: Vendor Styles/assets/vendor.css',
          allowNone: true,
          headerFiles: [
            'files/a.css',
            'files/b.css',
            'files/c.css',
            'files/d.css',
          ],
          inputFiles: ['addon-tree-output/**/*.css'],
          outputFile: '/assets/vendor.css',
        });
      });

      it('correctly orders concats from app.testFiles()', function() {
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

        app.testFiles('some-tree'); // run

        expect(count).to.eql(2);

        expect(args[0]).to.deep.eql({
          allowNone: true,
          annotation: 'Concat: Test Support JS',
          footerFiles: [
            'vendor/ember-cli/test-support-suffix.js',
          ],
          headerFiles: [
            'vendor/ember-cli/test-support-prefix.js',
            'files/d.js',
            'files/a.js',
            'files/b.js',
            'files/c.js',
          ],
          inputFiles: [
            'addon-test-support/**/*.js',
          ],
          outputFile: '/assets/test-support.js',
        });

        expect(args[1]).to.deep.eql({
          annotation: 'Concat: Test Support CSS',
          headerFiles: [
            'files/a.css',
            'files/b.css',
            'files/c.css',
            'files/d.css',
          ],
          outputFile: '/assets/test-support.css',
        });
      });
    });
  });

  it('shows ember-cli-shims deprecation', function() {
    let root = path.resolve(__dirname, '../../fixtures/app/npm');
    let project = setupProject(root);
    project.require = function() {
      return {
        version: '5.0.0',
      };
    };
    project.initializeAddons = function() {
      this.addons = [
        {
          name: 'ember-cli-babel',
          pkg: { version: '5.0.0' },
        },
      ];
    };

    app = new EmberApp({
      project,
    });

    expect(project.ui.output).to.contain("You have not included `ember-cli-shims` in your project's `bower.json` or `package.json`.");
  });
});
