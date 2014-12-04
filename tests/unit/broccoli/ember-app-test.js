/* global escape */

'use strict';

var fs       = require('fs');
var path     = require('path');
var Project  = require('../../../lib/models/project');
var EmberApp = require('../../../lib/broccoli/ember-app');
var assert   = require('assert');
var stub     = require('../../helpers/stub').stub;

describe('broccoli/ember-app', function() {
  var project, projectPath, emberApp, addonTreesForStub, addon;

  beforeEach(function() {
    projectPath = path.resolve(__dirname, '../../fixtures/addon/simple');
    var packageContents = require(path.join(projectPath, 'package.json'));

    project = new Project(projectPath, packageContents);
    project.require = function() {
      return function() {};
    };
    project.initializeAddons = function() {
      this.addons = [];
    };
  });


  describe('constructor', function() {
    it('should override project.configPath if configPath option is specified', function() {
      project.configPath = function() { return 'original value'; };

      new EmberApp({
        project: project,
        configPath: 'custom config path'
      });

      assert.equal(project.configPath(), 'custom config path');
    });

    it('should set bowerDirectory for app', function() {
      var app = new EmberApp({
        project: project
      });

      assert.equal(app.bowerDirectory, project.bowerDirectory);
      assert.equal(app.bowerDirectory, 'bower_components');
    });

    describe('_nofifyAddonIncluded', function() {
      beforeEach(function() {
        project.initializeAddons = function() { };
        project.addons = [{name: 'custom-addon'}];
      });

      it('should set the app on the addons', function() {
        var app = new EmberApp({
          project: project
        });

        var addon = project.addons[0];
        assert.deepEqual(addon.app, app);
      });
    });
  });

  describe('contentFor', function() {
    var config, defaultMatch;

    beforeEach(function() {
      project._addonsInitialized = true;
      project.addons = [];

      emberApp = new EmberApp({
        project: project
      });

      config = {
        modulePrefix: 'cool-foo'
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
          }
        });

        var actual = emberApp.contentFor(config, defaultMatch, 'foo');

        assert.deepEqual(calledConfig, config);
        assert.equal(calledType, 'foo');
        assert.equal(actual, 'blammo');
      });

      it('calls `contentFor` on each addon', function() {
        project.addons.push({
          contentFor: function() {
            return 'blammo';
          }
        });

        project.addons.push({
          contentFor: function() {
            return 'blahzorz';
          }
        });

        var actual = emberApp.contentFor(config, defaultMatch, 'foo');

        assert.equal(actual, 'blammo\nblahzorz');
      });
    });

    describe('contentFor("head")', function() {
      it('includes the `meta` tag in `head` by default', function() {
        var escapedConfig = escape(JSON.stringify(config));
        var metaExpected = '<meta name="cool-foo/config/environment" ' +
                           'content="' + escapedConfig + '" />';
        var actual = emberApp.contentFor(config, defaultMatch, 'head');

        assert(actual.indexOf(metaExpected) > -1);
      });

      it('does not include the `meta` tag in `head` if storeConfigInMeta is false', function() {
        emberApp.options.storeConfigInMeta = false;

        var escapedConfig = escape(JSON.stringify(config));
        var metaExpected = '<meta name="cool-foo/config/environment" ' +
                           'content="' + escapedConfig + '" />';
        var actual = emberApp.contentFor(config, defaultMatch, 'head');

        assert(actual.indexOf(metaExpected) === -1);
      });

      it('includes the `base` tag in `head` if locationType is auto', function() {
        config.locationType = 'auto';
        config.baseURL = '/';
        var expected = '<base href="/" />';
        var actual = emberApp.contentFor(config, defaultMatch, 'head');

        assert(actual.indexOf(expected) > -1);
      });

      it('includes the `base` tag in `head` if locationType is none (testem requirement)', function() {
        config.locationType = 'none';
        config.baseURL = '/';
        var expected = '<base href="/" />';
        var actual = emberApp.contentFor(config, defaultMatch, 'head');

        assert(actual.indexOf(expected) > -1);
      });

      it('does not include the `base` tag in `head` if locationType is hash', function() {
        config.locationType = 'hash';
        config.baseURL = '/foo/bar';
        var expected = '<base href="/foo/bar/" />';
        var actual = emberApp.contentFor(config, defaultMatch, 'head');

        assert(actual.indexOf(expected) === -1);
      });
    });

    describe('contentFor("config-module")', function() {
      it('includes the meta gathering snippet by default', function() {
        var metaSnippetPath = path.join(__dirname, '..','..','..','lib','broccoli','app-config-from-meta.js');
        var expected = fs.readFileSync(metaSnippetPath);

        var actual = emberApp.contentFor(config, defaultMatch, 'config-module');

        assert(actual.indexOf(expected) > -1);
      });

      it('includes the raw config if storeConfigInMeta is false', function() {
        emberApp.options.storeConfigInMeta = false;

        var expected = JSON.stringify(config);
        var actual = emberApp.contentFor(config, defaultMatch, 'config-module');

        assert(actual.indexOf(expected) > -1);
      });
    });

    it('has no default value other than `head`', function() {
      assert.equal(emberApp.contentFor(config, defaultMatch, 'foo'), '');
      assert.equal(emberApp.contentFor(config, defaultMatch, 'body'), '');
      assert.equal(emberApp.contentFor(config, defaultMatch, 'blah'), '');
    });
  });

  describe('addons', function() {
    describe('included hook', function() {
      it('included hook is called properly on instantiation', function() {
        var called = false;
        var passedApp;

        addon = {
          included: function(app) { called = true; passedApp = app; },
          treeFor: function() { }
        };

        project.initializeAddons = function() {
          this.addons = [ addon ];
        };

        emberApp = new EmberApp({
          project: project
        });

        assert.ok(called);
        assert.equal(passedApp, emberApp);
      });

      it('does not throw an error if the addon does not implement `included`', function() {
        delete addon.included;

        project.initializeAddons = function() {
          this.addons = [ addon ];
        };

        assert.doesNotThrow(
          function() {
            emberApp = new EmberApp({
              project: project
            });
          },
          /addon must implement the `included`/
        );
      });
    });

    describe('addonTreesFor', function() {
      beforeEach(function() {
        addon = {
          included: function() { },
          treeFor: function() { }
        };

        project.initializeAddons = function() {
          this.addons = [ addon ];
        };

      });

      it('addonTreesFor returns an empty array if no addons return a tree', function() {
        emberApp = new EmberApp({
          project: project
        });

        assert.deepEqual(emberApp.addonTreesFor('blah'), []);
      });

      it('addonTreesFor calls treesFor on the addon', function() {
        emberApp = new EmberApp({
          project: project
        });

        var sampleAddon = project.addons[0];
        var actualTreeName;

        sampleAddon.treeFor = function(name) {
          actualTreeName = name;

          return 'blazorz';
        };

        assert.deepEqual(emberApp.addonTreesFor('blah'), ['blazorz']);
        assert.equal(actualTreeName, 'blah');
      });

      it('addonTreesFor does not throw an error if treeFor is not defined', function() {
        delete addon.treeFor;

        emberApp = new EmberApp({
          project: project
        });

        assert.doesNotThrow(
          function() {
            emberApp.addonTreesFor('blah');
          },
          /addon must implement the `treeFor`/
        );
      });

      describe('addonTreesFor is called properly', function() {
        beforeEach(function() {
          emberApp = new EmberApp({
            project: project
          });

          addonTreesForStub = stub(emberApp, 'addonTreesFor', ['batman']);
        });

        it('_processedVendorTree calls addonTreesFor', function() {
          emberApp._processedVendorTree();

          assert.equal(addonTreesForStub.calledWith[0][0], 'addon');
          assert.equal(addonTreesForStub.calledWith[1][0], 'vendor');
        });

        it('_processedAppTree calls addonTreesFor', function() {
          emberApp._processedAppTree();

          assert.equal(addonTreesForStub.calledWith[0][0], 'app');
        });

        it('styles calls addonTreesFor', function() {
          var trees = emberApp.styles();

          assert.equal(addonTreesForStub.calledWith[0][0], 'styles');
          assert(trees.inputTrees[0].inputTree.inputTrees.indexOf('batman') !== -1, 'contains addon tree');
        });
      });
    });
    describe('toTree', function() {
      beforeEach(function() {
        addon = {
          included: function() { },
          treeFor: function() { },
          postprocessTree: function() { }
        };

        project.initializeAddons = function() {
          this.addons = [ addon ];
        };

        emberApp = new EmberApp({
          project: project
        });
      });

      it('calls postProcessTree if defined', function() {
        stub(emberApp, 'toArray', []);
        stub(addon, 'postprocessTree', 'derp');

        assert.equal(emberApp.toTree(), 'derp');
      });

      it('calls addonPostprocessTree', function() {
        stub(emberApp, 'toArray', []);
        stub(emberApp, 'addonPostprocessTree', 'blap');

        assert.equal(emberApp.toTree(), 'blap');
      });
    });

    describe('isEnabled is called properly', function() {
      beforeEach(function() {
        projectPath = path.resolve(__dirname, '../../fixtures/addon/env-addons');
        var packageContents = require(path.join(projectPath, 'package.json'));
        project = new Project(projectPath, packageContents);
      });

      afterEach(function() {
        process.env.EMBER_ENV = undefined;
      });

      describe('with environment', function() {
        it('development', function() {
          process.env.EMBER_ENV = 'development';
          emberApp = new EmberApp({ project: project });

          assert.equal(emberApp.project.addons.length, 5);
        });

        it('foo', function() {
          process.env.EMBER_ENV = 'foo';
          emberApp = new EmberApp({ project: project });

          assert.equal(emberApp.project.addons.length, 6);
        });
      });

    });
  });

  describe('vendorFiles', function() {
    var defaultVendorFiles = [
      'loader.js', 'jquery.js', 'handlebars.js', 'ember.js',
      'app-shims.js', 'ember-resolver.js', 'ember-load-initializers.js'
    ];

    it('defines vendorFiles by default', function() {
      emberApp = new EmberApp();
      assert.deepEqual(
        Object.keys(emberApp.vendorFiles),
        defaultVendorFiles);
    });

    it('redefines a location of a vendor asset', function() {
      emberApp = new EmberApp({
        vendorFiles: {
          'ember.js': 'vendor/ember.js'
        }
      });
      assert.equal(emberApp.vendorFiles['ember.js'], 'vendor/ember.js');
    });

    it('defines vendorFiles in order even when option for it is passed', function() {
      emberApp = new EmberApp({
        vendorFiles: {
          'ember.js': 'vendor/ember.js'
        }
      });
      assert.deepEqual(
        Object.keys(emberApp.vendorFiles),
        defaultVendorFiles);
    });

    it('removes dependency in vendorFiles', function() {
      emberApp = new EmberApp({
        vendorFiles: {
          'ember.js': null,
          'handlebars.js': null
        }
      });
      var vendorFiles = Object.keys(EmberApp);
      assert.equal(vendorFiles.indexOf('ember.js'), -1);
      assert.equal(vendorFiles.indexOf('handlebars.js'), -1);
    });
  });
});
