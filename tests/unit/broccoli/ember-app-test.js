/* global escape */

'use strict';

var fs         = require('fs');
var path       = require('path');
var Project    = require('../../../lib/models/project');
var expect     = require('chai').expect;
var proxyquire = require('proxyquire');
var td = require('testdouble');

var MockCLI = require('../../helpers/mock-cli');
var MockUI = require('console-ui/mock');

var mergeTreesStub;
var EmberApp = proxyquire('../../../lib/broccoli/ember-app', {
  './merge-trees': function() {
    return mergeTreesStub.apply(this, arguments);
  },
});

describe('broccoli/ember-app', function() {
  var project, projectPath, app, addon;

  function setupProject(rootPath) {
    var packageContents = require(path.join(rootPath, 'package.json'));
    var cli = new MockCLI();

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

    mergeTreesStub = require('../../../lib/broccoli/merge-trees');
  });

  describe('constructor', function() {
    it('should override project.configPath if configPath option is specified', function() {
      project.configPath = function() { return 'original value'; };

      var expected = 'custom config path';

      new EmberApp({
        project: project,
        configPath: expected,
      });

      expect(project.configPath().slice(-expected.length)).to.equal(expected);
    });

    it('should set bowerDirectory for app', function() {
      var app = new EmberApp({
        project: project,
      });

      expect(app.bowerDirectory).to.equal(project.bowerDirectory);
      expect(app.bowerDirectory).to.equal('bower_components');
    });

    it('should merge options with defaults to depth', function() {
      var app = new EmberApp({
        project: project,
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
      var app = new EmberApp({
        project: project,
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
        },
      });
    });

    it('should watch vendor if it exists', function() {
      var app = new EmberApp({
        project: project,
      });

      expect(app.options.trees.vendor.__broccoliGetInfo__()).to.have.property('watched', true);
    });

    describe('_notifyAddonIncluded', function() {
      beforeEach(function() {
        project.initializeAddons = function() { };
        project.addons = [{name: 'custom-addon'}];
      });

      it('should set the app on the addons', function() {
        var app = new EmberApp({
          project: project,
        });

        var addon = project.addons[0];
        expect(addon.app).to.deep.equal(app);
      });
    });

    describe('loader.js missing', function() {
      it('does not error when loader.js is present in registry.availablePlugins', function() {
        expect(function() {
          new EmberApp({
            project: project,
          });
        }).to.not.throw(/loader.js addon is missing/);
      });

      it('throws an error when loader.js is not present in registry.availablePlugins', function() {
        expect(function() {
          new EmberApp({
            project: project,
            registry: {
              add: function() { },
              availablePlugins: { },
            },
          });
        }).to.throw(/loader.js addon is missing/);
      });

      it('does not throw an error if _ignoreMissingLoader is set', function() {
        expect(function() {
          new EmberApp({
            project: project,
            registry: {
              add: function() { },
              availablePlugins: { },
            },
            _ignoreMissingLoader: true,
          });
        }).to.not.throw(/loader.js addon is missing/);
      });
    });

    describe('ember-resolver NPM vs Bower', function() {
      it('does not load ember-resolver.js as bower dep when ember-resolver is present in registry.availablePlugins', function() {
        var app = new EmberApp({ project: project });
        expect(app.vendorFiles['ember-resolver']).to.equal(undefined);
      });

      it('keeps ember-resolver.js in vendorFiles when NPM ember-resolver is not installed, but is present in bower.json', function() {
        project.bowerDependencies = function() { return { 'ember': {}, 'ember-resolver': {} }; };
        var app = new EmberApp({
          project: project,
          registry: {
            add: function() { },
            availablePlugins: { 'loader.js': {} },
          },
        });
        expect(app.vendorFiles['ember-resolver.js'][0]).to.equal('bower_components/ember-resolver/dist/modules/ember-resolver.js');
      });

      it('removes ember-resolver.js from vendorFiles when not in bower.json and NPM ember-resolver not installed', function() {
        project.bowerDependencies = function() { return { 'ember': {} }; };
        var app = new EmberApp({
          project: project,
          registry: {
            add: function() { },
            availablePlugins: { 'loader.js': {} },
          },
        });

        expect(app.vendorFiles['ember-resolver']).to.equal(undefined);
      });
    });

    describe('options.babel.sourceMaps', function() {
      it('disables babel sourcemaps by default', function() {
        var app = new EmberApp({
          project: project,
        });

        expect(app.options.babel.sourceMaps).to.be.false;
      });

      it('can enable babel sourcemaps with the option', function() {
        var app = new EmberApp({
          project: project,
          babel: {
            sourceMaps: 'inline',
          },
        });

        expect(app.options.babel.sourceMaps).to.equal('inline');
      });
    });
  });

  describe('contentFor', function() {
    var config, defaultMatch;

    beforeEach(function() {
      project._addonsInitialized = true;
      project.addons = [];

      app = new EmberApp({
        project: project,
      });

      config = {
        modulePrefix: 'cool-foo',
      };

      defaultMatch = '{{content-for \'head\'}}';
    });

    describe('contentFor from addons', function() {
      it('calls `contentFor` on addon', function() {
        var calledConfig, calledType;

        project.addons.push({
          contentFor: function(type, config) {
            calledType = type;
            calledConfig = config;

            return 'blammo';
          },
        });

        var actual = app.contentFor(config, defaultMatch, 'foo');

        expect(calledConfig).to.deep.equal(config);
        expect(calledType).to.equal('foo');
        expect(actual).to.equal('blammo');
      });

      it('calls `contentFor` on each addon', function() {
        project.addons.push({
          contentFor: function() {
            return 'blammo';
          },
        });

        project.addons.push({
          contentFor: function() {
            return 'blahzorz';
          },
        });

        var actual = app.contentFor(config, defaultMatch, 'foo');

        expect(actual).to.equal('blammo\nblahzorz');
      });

      it('allows later addons to inspect previous content', function() {
        var calledContent;

        project.addons.push({
          contentFor: function() {
            return 'zero';
          },
        });

        project.addons.push({
          contentFor: function() {
            return 'one';
          },
        });

        project.addons.push({
          contentFor: function(type, config, content) {
            calledContent = content.slice();
            content.pop();
            return 'two';
          },
        });

        var actual = app.contentFor(config, defaultMatch, 'foo');

        expect(calledContent).to.deep.equal(['zero', 'one']);
        expect(actual).to.equal('zero\ntwo');
      });
    });

    describe('contentFor("head")', function() {
      it('includes the `meta` tag in `head` by default', function() {
        var escapedConfig = escape(JSON.stringify(config));
        var metaExpected = '<meta name="cool-foo/config/environment" ' +
          'content="' + escapedConfig + '" />';
        var actual = app.contentFor(config, defaultMatch, 'head');

        expect(actual).to.contain(metaExpected);
      });

      it('does not include the `meta` tag in `head` if storeConfigInMeta is false', function() {
        app.options.storeConfigInMeta = false;

        var escapedConfig = escape(JSON.stringify(config));
        var metaExpected = '<meta name="cool-foo/config/environment" ' +
          'content="' + escapedConfig + '" />';
        var actual = app.contentFor(config, defaultMatch, 'head');

        expect(actual).to.not.contain(metaExpected);
      });

      it('includes the `base` tag in `head` if locationType is auto', function() {
        config.locationType = 'auto';
        config.baseURL = '/';
        var expected = '<base href="/" />';
        var actual = app.contentFor(config, defaultMatch, 'head');

        expect(actual).to.contain(expected);
      });

      it('includes the `base` tag in `head` if locationType is none (testem requirement)', function() {
        config.locationType = 'none';
        config.baseURL = '/';
        var expected = '<base href="/" />';
        var actual = app.contentFor(config, defaultMatch, 'head');

        expect(actual).to.contain(expected);
      });

      it('does not include the `base` tag in `head` if locationType is hash', function() {
        config.locationType = 'hash';
        config.baseURL = '/foo/bar';
        var expected = '<base href="/foo/bar/" />';
        var actual = app.contentFor(config, defaultMatch, 'head');

        expect(actual).to.not.contain(expected);
      });

      it('does not include the `base` tag in `head` if baseURL is undefined', function() {
        var expected = '<base href=';
        var actual = app.contentFor(config, defaultMatch, 'head');

        expect(actual).to.not.contain(expected);
      });
    });

    describe('contentFor("config-module")', function() {
      it('includes the meta gathering snippet by default', function() {
        var metaSnippetPath = path.join(__dirname, '..', '..', '..', 'lib', 'broccoli', 'app-config-from-meta.js');
        var expected = fs.readFileSync(metaSnippetPath, { encoding: 'utf8' });

        var actual = app.contentFor(config, defaultMatch, 'config-module');

        expect(actual).to.contain(expected);
      });

      it('includes the raw config if storeConfigInMeta is false', function() {
        app.options.storeConfigInMeta = false;

        var expected = JSON.stringify(config);
        var actual = app.contentFor(config, defaultMatch, 'config-module');

        expect(actual).to.contain(expected);
      });
    });

    it('has no default value other than `head`', function() {
      expect(app.contentFor(config, defaultMatch, 'foo')).to.equal('');
      expect(app.contentFor(config, defaultMatch, 'body')).to.equal('');
      expect(app.contentFor(config, defaultMatch, 'blah')).to.equal('');
    });
  });

  describe('addons', function() {
    describe('included hook', function() {
      it('included hook is called properly on instantiation', function() {
        var called = false;
        var passedApp;

        addon = {
          included: function(app) { called = true; passedApp = app; },
          treeFor: function() { },
        };

        project.initializeAddons = function() {
          this.addons = [addon];
        };

        var app = new EmberApp({
          project: project,
        });

        expect(called).to.be.true;
        expect(passedApp).to.equal(app);
      });

      it('does not throw an error if the addon does not implement `included`', function() {
        delete addon.included;

        project.initializeAddons = function() {
          this.addons = [addon];
        };

        expect(function() {
          new EmberApp({
            project: project,
          });
        }).to.not.throw(/addon must implement the `included`/);
      });
    });

    describe('addonTreesFor', function() {
      beforeEach(function() {
        addon = {
          included: function() { },
          treeFor: function() { },
        };

        project.initializeAddons = function() {
          this.addons = [addon];
        };

        app = new EmberApp({
          project: project,
        });
      });

      it('addonTreesFor returns an empty array if no addons return a tree', function() {
        expect(app.addonTreesFor('blah')).to.deep.equal([]);
      });

      it('addonTreesFor calls treesFor on the addon', function() {
        var sampleAddon = project.addons[0];
        var actualTreeName;

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
          project: project,
        });

        expect(function() {
          app.addonTreesFor('blah');
        }).not.to.throw(/addon must implement the `treeFor`/);
      });

      describe('addonTreesFor is called properly', function() {
        beforeEach(function() {
          app = new EmberApp({
            project: project,
          });

          app.addonTreesFor = td.function();
          td.when(app.addonTreesFor(), {ignoreExtraArgs: true}).thenReturn(['batman']);
        });

        it('_processedVendorTree calls addonTreesFor', function() {
          app._processedVendorTree();

          var args = td.explain(app.addonTreesFor).calls.map(function(call) { return call.args[0]; });

          expect(args).to.deep.equal(['addon', 'vendor']);
        });

        it('_processedAppTree calls addonTreesFor', function() {
          app._processedAppTree();

          var args = td.explain(app.addonTreesFor).calls.map(function(call) { return call.args[0]; });

          expect(args).to.deep.equal(['app']);
        });
      });
    });

    describe('postprocessTree is called properly', function() {
      beforeEach(function() {
        app = new EmberApp({
          project: project,
        });

        app.addonPostprocessTree = td.function();
        td.when(app.addonPostprocessTree(), {ignoreExtraArgs: true}).thenReturn(['batman']);
      });

      it('styles calls addonTreesFor', function() {
        app.styles();

        var captor = td.matchers.captor();
        td.verify(app.addonPostprocessTree('css', captor.capture()));

        expect(captor.value.description).to.equal('styles', 'should be called with consolidated tree');
      });

      it('template type is called', function() {
        var oldLoad = app.registry.load;
        app.registry.load = function(type) {
          if (type === 'template') {
            return [
              {
                toTree: function() {
                  return {
                    description: 'template',
                  };
                },
              }];
          } else {
            return oldLoad.call(app.registry, type);
          }
        };

        app._processedTemplatesTree();

        var captor = td.matchers.captor();
        td.verify(app.addonPostprocessTree('template', captor.capture()));

        expect(captor.value.description).to.equal('template', 'should be called with consolidated tree');
      });
    });

    describe('toTree', function() {
      beforeEach(function() {
        addon = {
          included: function() { },
          treeFor: function() { },
          postprocessTree: td.function(),
        };

        project.initializeAddons = function() {
          this.addons = [addon];
        };

        app = new EmberApp({
          project: project,
        });
      });

      it('calls postProcessTree if defined', function() {
        app.toArray = td.function();

        td.when(app.toArray(), {ignoreExtraArgs: true}).thenReturn([]);
        td.when(addon.postprocessTree(), {ignoreExtraArgs: true}).thenReturn('derp');

        expect(app.toTree()).to.equal('derp');
      });

      it('calls addonPostprocessTree', function() {
        app.toArray = td.function();
        app.addonPostprocessTree = td.function();

        td.when(app.toArray(), {ignoreExtraArgs: true}).thenReturn([]);
        td.when(app.addonPostprocessTree(), {ignoreExtraArgs: true}).thenReturn('blap');

        expect(app.toTree()).to.equal('blap');
      });

      it('calls each addon postprocessTree hook', function() {
        app._processedTemplatesTree = td.function();

        td.when(app._processedTemplatesTree(), {ignoreExtraArgs: true}).thenReturn('x');
        td.when(addon.postprocessTree(), {ignoreExtraArgs: true}).thenReturn('blap');

        expect(app.toTree()).to.equal('blap');

        var args = td.explain(addon.postprocessTree).calls.map(function(call) { return call.args[0]; });

        expect(args).to.deep.equal(['js', 'css', 'test', 'all']);
      });
    });

    describe('addons can be disabled', function() {
      beforeEach(function() {
        projectPath = path.resolve(__dirname, '../../fixtures/addon/env-addons');
        var packageContents = require(path.join(projectPath, 'package.json'));
        var cli = new MockCLI();
        project = new Project(projectPath, packageContents, cli.ui, cli);
        var discoverFromCli = td.replace(project.addonDiscovery, 'discoverFromCli');
        td.when(discoverFromCli(), { ignoreExtraArgs: true }).thenReturn([]);
      });

      afterEach(function() {
        process.env.EMBER_ENV = undefined;
      });

      describe('isEnabled is called properly', function() {
        describe('with environment', function() {
          var emberFooEnvAddonFixture;

          beforeEach(function() {
            emberFooEnvAddonFixture = require(path.resolve(projectPath, 'node_modules/ember-foo-env-addon/index.js'));
          });

          it('development', function() {
            process.env.EMBER_ENV = 'development';
            var app = new EmberApp({ project: project });

            emberFooEnvAddonFixture.app = app;
            expect(app._addonEnabled(emberFooEnvAddonFixture)).to.be.false;

            expect(app.project.addons.length).to.equal(8);
          });

          it('foo', function() {
            process.env.EMBER_ENV = 'foo';
            var app = new EmberApp({ project: project });

            emberFooEnvAddonFixture.app = app;
            expect(app._addonEnabled(emberFooEnvAddonFixture)).to.be.true;

            expect(app.project.addons.length).to.equal(9);
          });
        });
      });

      describe('blacklist', function() {
        it('prevents addons to be added to the project', function() {
          process.env.EMBER_ENV = 'foo';

          var app = new EmberApp({
            project: project,
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

            var app = new EmberApp({
              project: project,
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

          var app = new EmberApp({
            project: project,
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
              project: project,
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
            project: project,
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
          project: project,
        });
      });

      it('does not throw an error if lintTree is not defined', function() {
        app.addonLintTree();
      });

      it('calls lintTree on the addon', function() {
        mergeTreesStub = td.function();

        td.when(addon.lintTree('blah', 'blam')).thenReturn('blazorz');

        app.addonLintTree('blah', 'blam');

        td.verify(mergeTreesStub(['blazorz'], {
          overwrite: true,
          annotation: 'TreeMerger (lint blah)',
        }));
      });

      it('filters out tree if lintTree returns falsey', function() {
        mergeTreesStub = td.function();

        td.when(addon.lintTree(), {ignoreExtraArgs: true}).thenReturn(false);

        app.addonLintTree();

        td.verify(mergeTreesStub([]), {ignoreExtraArgs: true});
      });
    });
  });

  describe('import', function() {
    beforeEach(function() {
      app = new EmberApp({
        project: project,
      });
    });

    afterEach(function() {
      process.env.EMBER_ENV = undefined;
    });

    it('appends dependencies to vendor by default', function() {
      app.import('vendor/moment.js');
      var outputFile = app._scriptOutputFiles['/assets/vendor.js'];

      expect(outputFile).to.be.instanceof(Array);
      expect(outputFile.indexOf('vendor/moment.js')).to.equal(outputFile.length - 1);
    });
    it('appends dependencies', function() {
      app.import('vendor/moment.js', {type: 'vendor'});

      var outputFile = app._scriptOutputFiles['/assets/vendor.js'];

      expect(outputFile).to.be.instanceof(Array);
      expect(outputFile.indexOf('vendor/moment.js')).to.equal(outputFile.length - 1);
    });

    it('prepends dependencies', function() {
      app.import('vendor/es5-shim.js', {type: 'vendor', prepend: true});

      var outputFile = app._scriptOutputFiles['/assets/vendor.js'];

      expect(outputFile).to.be.instanceof(Array);
      expect(outputFile.indexOf('vendor/es5-shim.js')).to.equal(0);
    });

    it('prepends dependencies to outputFile', function() {
      app.import('vendor/moment.js', {outputFile: 'moment.js', prepend: true});

      var outputFile = app._scriptOutputFiles['moment.js'];

      expect(outputFile).to.be.instanceof(Array);
      expect(outputFile.indexOf('vendor/moment.js')).to.equal(0);
    });

    it('appends dependencies to outputFile', function() {
      app.import('vendor/moment.js', {outputFile: 'moment.js'});

      var outputFile = app._scriptOutputFiles['moment.js'];

      expect(outputFile).to.be.instanceof(Array);
      expect(outputFile.indexOf('vendor/moment.js')).to.equal(outputFile.length - 1);
    });

    it('defaults to development if production is not set', function() {
      process.env.EMBER_ENV = 'production';
      app.import({
        'development': 'vendor/jquery.js',
      });

      var outputFile = app._scriptOutputFiles['/assets/vendor.js'];
      expect(outputFile.indexOf('vendor/jquery.js')).to.equal(outputFile.length - 1);
    });

    it('honors explicitly set to null in environment', function() {
      process.env.EMBER_ENV = 'production';
      // set EMBER_ENV before creating the project

      app = new EmberApp({
        project: project,
      });

      app.import({
        'development': 'vendor/jquery.js',
        'production':  null,
      });

      expect(app._scriptOutputFiles['/assets/vendor.js']).to.not.contain('vendor/jquery.js');
    });

    it('normalizes asset path correctly', function() {
      app.import('vendor\\path\\to\\lib.js', {type: 'vendor'});
      app.import('vendor/path/to/lib2.js', {type: 'vendor'});

      expect(app._scriptOutputFiles['/assets/vendor.js']).to.contain('vendor/path/to/lib.js');
      expect(app._scriptOutputFiles['/assets/vendor.js']).to.contain('vendor/path/to/lib2.js');
    });
  });

  describe('vendorFiles', function() {
    var defaultVendorFiles = [
      'jquery.js',
      'ember.js',
      'app-shims.js',
    ];

    describe('handlebars.js', function() {
      it('does not app.import handlebars if not present in bower.json', function() {
        var app = new EmberApp({
          project: project,
        });

        expect(app.vendorFiles).not.to.include.keys('handlebars.js');
      });

      it('includes handlebars if present in bower.json', function() {
        projectPath = path.resolve(__dirname, '../../fixtures/project-with-handlebars');
        project = setupProject(projectPath);

        var app = new EmberApp({
          project: project,
        });

        expect(app.vendorFiles).to.include.keys('handlebars.js');
      });

      it('includes handlebars if present in provided `vendorFiles`', function() {
        var app = new EmberApp({
          project: project,
          vendorFiles: {
            'handlebars.js': 'some/path/whatever.js',
          },
        });

        expect(app.vendorFiles).to.include.keys('handlebars.js');
      });
    });

    it('defines vendorFiles by default', function() {
      app = new EmberApp({
        project: project,
      });
      expect(Object.keys(app.vendorFiles)).to.deep.equal(defaultVendorFiles);
    });

    it('redefines a location of a vendor asset', function() {
      app = new EmberApp({
        project: project,

        vendorFiles: {
          'ember.js': 'vendor/ember.js',
        },
      });
      expect(app.vendorFiles['ember.js']).to.equal('vendor/ember.js');
    });

    it('defines vendorFiles in order even when option for it is passed', function() {
      app = new EmberApp({
        project: project,

        vendorFiles: {
          'ember.js': 'vendor/ember.js',
        },
      });
      expect(Object.keys(app.vendorFiles)).to.deep.equal(defaultVendorFiles);
    });

    it('removes dependency in vendorFiles', function() {
      app = new EmberApp({
        project: project,

        vendorFiles: {
          'ember.js': null,
          'handlebars.js': null,
        },
      });
      var vendorFiles = Object.keys(app.vendorFiles);
      expect(vendorFiles).to.not.contain('ember.js');
      expect(vendorFiles).to.not.contain('handlebars.js');
    });

    it('defaults to ember.debug.js if exists in bower_components', function () {
      var root = path.resolve(__dirname, '../../fixtures/app/with-default-ember-debug');

      app = new EmberApp({
        project: setupProject(root),
      });

      var files = app.vendorFiles['ember.js'];
      expect(files.development).to.equal('bower_components/ember/ember.debug.js');
    });

    it('switches the default ember.debug.js to ember.js if it does not exist', function () {
      var root = path.resolve(__dirname, '../../fixtures/app/without-ember-debug');

      app = new EmberApp({
        project: setupProject(root),
      });

      var files = app.vendorFiles['ember.js'];
      expect(files.development).to.equal('bower_components/ember/ember.js');
    });

    it('does not clobber an explicitly configured ember development file', function () {
      app = new EmberApp({
        project: project,

        vendorFiles: {
          'ember.js': {
            development: 'vendor/ember.debug.js',
          },
        },
      });
      var files = app.vendorFiles['ember.js'];
      expect(files.development).to.equal('vendor/ember.debug.js');
    });
  });

  it('fails with invalid type', function() {
    var app = new EmberApp({
      project: project,
    });

    expect(function() {
      app.import('vendor/b/c/foo.js', { type: 'javascript'});
    }).to.throw(/You must pass either `vendor` or `test` for options.type in your call to `app.import` for file: foo.js/);
  });

  describe('_resolveLocal', function() {
    it('resolves a path relative to the project root', function() {
      var app = new EmberApp({
        project: project,
      });

      var result = app._resolveLocal('foo');
      expect(result).to.equal(path.join(project.root, 'foo'));
    });
  });

  describe('concatFiles()', function() {
    beforeEach(function() {
      app = new EmberApp({ project: project });
    });

    it('shows deprecation message if called directly', function() {
      app.concatFiles('input-path-somewhere', {
        outputFile: 'foo.js',
      });

      expect(project.ui.output).to.contain('EmberApp.concatFiles() is deprecated');
    });

    it('ignores deprecation message if called through _concatFiles()', function() {
      app._concatFiles('input-path-somewhere', {
        outputFile: 'foo.js',
      });

      expect(project.ui.output).to.not.contain('EmberApp.concatFiles() is deprecated');
    });

    describe('podTemplates', function() {
      it('works', function() {
        var app = new EmberApp({
          project: project,
        });

        var wasCalledCount = 0;
        app.podTemplates = function() {
          wasCalledCount++;
        };

        expect(wasCalledCount).to.eql(0);
        app._templatesTree();
        expect(wasCalledCount).to.eql(1);
      });
    });

    describe('concat order', function() {
      var count = 0;
      var args = [];

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

        expect(count).to.eql(3);

        expect(args[2]).to.deep.eql({
          annotation: 'Concat: Vendor Styles/assets/vendor.css',
          headerFiles: [
            'files/a.css',
            'files/b.css',
            'files/c.css',
            'files/d.css',
            'files/e.css',
            'vendor/addons.css',
          ],
          outputFile: '/assets/vendor.css',
        });
      });

      it('correctly orders concats from app.styles()', function() {
        app.import('files/b.css');
        app.import('files/c.css');
        app.import('files/a.css', { prepend: true });
        app.import('files/d.css');

        app.styles(); // run

        expect(count).to.eql(3);

        expect(args[0]).to.deep.eql({
          allowNone: true,
          annotation: 'Concat: Addon CSS',
          inputFiles: [
            '**/*.css',
          ],
          outputFile: '/addons.css',
        });

        expect(args[1]).to.deep.eql({
          allowNone: true,
          annotation: 'Concat: Addon JS',
          inputFiles: [
            '**/*.js',
          ],
          outputFile: '/addons.js',
        });

        expect(args[2]).to.deep.eql({
          annotation: 'Concat: Vendor Styles/assets/vendor.css',
          headerFiles: [
            'files/a.css',
            'files/b.css',
            'files/c.css',
            'files/d.css',
            'vendor/addons.css',
          ],
          outputFile: '/assets/vendor.css',
        });
      });

      it('correctly orders concats from app.javacsript()', function() {
        app.import('files/b.js');
        app.import('files/c.js');
        app.import('files/a.js');
        app.import('files/a.js', { prepend: true }); // Should end up second.
        app.import('files/d.js');
        app.import('files/d.js', { prepend: true }); // Should end up first.
        app.import('files/d.js');

        app.javascript(); // run

        expect(count).to.eql(2);
        // should be unrelated files
        expect(args[0]).to.deep.eql({
          annotation: "Concat: App",
          footerFiles: [
            "vendor/ember-cli/app-suffix.js",
            "vendor/ember-cli/app-config.js",
            "vendor/ember-cli/app-boot.js",
          ],
          headerFiles: [
            "vendor/ember-cli/app-prefix.js",
          ],
          inputFiles: [
            "test-project/**/*.js",
          ],
          outputFile: "/assets/test-project.js",
        });

        // should be: a,b,c,d in output
        expect(args[1]).to.deep.eql({
          annotation: "Concat: Vendor /assets/vendor.js",
          headerFiles: [
            "vendor/ember-cli/vendor-prefix.js",
            "files/d.js",
            "files/a.js",
            "bower_components/jquery/dist/jquery.js",
            "bower_components/ember/ember.js",
            "bower_components/ember-cli-shims/app-shims.js",
            "files/b.js",
            "files/c.js",
            "vendor/addons.js",
            "vendor/ember-cli/vendor-suffix.js",
          ],
          outputFile: "/assets/vendor.js",
          separator: '\n;',
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

        expect(count).to.eql(4);

        expect(args[0]).to.deep.eql({
          allowNone: true,
          annotation: 'Concat: Addon CSS',
          inputFiles: ['**/*.css'],
          outputFile: '/addons.css',
        });

        expect(args[1]).to.deep.eql({
          allowNone: true,
          annotation: 'Concat: Addon JS',
          inputFiles: ['**/*.js'],
          outputFile: '/addons.js',
        });

        expect(args[2]).to.deep.eql({
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

        expect(args[3]).to.deep.eql({
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
});

