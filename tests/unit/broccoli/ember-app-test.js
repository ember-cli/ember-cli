/* global escape */

'use strict';

var fs         = require('fs');
var path       = require('path');
var Project    = require('../../../lib/models/project');
var expect     = require('chai').expect;
var stub       = require('../../helpers/stub').stub;
var proxyquire = require('proxyquire');

var MockUI = require('../../helpers/mock-ui');

var mergeTreesStub;
var EmberApp = proxyquire('../../../lib/broccoli/ember-app', {
  './merge-trees': function() {
    return mergeTreesStub.apply(this, arguments);
  }
});

describe('broccoli/ember-app', function() {
  var project, projectPath, emberApp, addonTreesForStub, addon;

  function setupProject(rootPath) {
    var packageContents = require(path.join(rootPath, 'package.json'));

    project = new Project(rootPath, packageContents, new MockUI());
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
        configPath: expected
      });

      expect(project.configPath().slice(-expected.length)).to.equal(expected);
    });

    it('should set bowerDirectory for app', function() {
      var app = new EmberApp({
        project: project
      });

      expect(app.bowerDirectory).to.equal(project.bowerDirectory);
      expect(app.bowerDirectory).to.equal('bower_components');
    });

    it('should merge options with defaults to depth', function() {
      var app = new EmberApp({
        project: project,
        foo: {
          bar: ['baz']
        },
        fooz: {
          bam: {
            boo: ['default']
          }
        }
      }, {
        foo: {
          bar: ['bizz']
        },
        fizz: 'fizz',
        fooz: {
          bam: {
            boo: ['custom']
          }
        }
      });

      expect(app.options.foo).to.deep.eql({
        bar: ['bizz']
      });
      expect(app.options.fizz).to.eql('fizz');
      expect(app.options.fooz).to.eql({
        bam: {
          boo: ['custom']
        }
      });
    });

    it('should do the right thing when merging default object options', function() {
      var app = new EmberApp({
        project: project,
      }, {
        minifyJS: {
          enabled: true,
          options: {
            exclusions: ['hey', 'you']
          }
        }
      });

      expect(app.options.minifyJS).to.deep.equal({
        enabled: true,
        options: {
          exclusions: ['hey', 'you']
        }
      });
    });

    describe('_notifyAddonIncluded', function() {
      beforeEach(function() {
        project.initializeAddons = function() { };
        project.addons = [{name: 'custom-addon'}];
      });

      it('should set the app on the addons', function() {
        var app = new EmberApp({
          project: project
        });

        var addon = project.addons[0];
        expect(addon.app).to.deep.equal(app);
      });
    });

    describe('loader.js missing', function() {
      it('does not error when loader.js is present in registry.availablePlugins', function() {
        expect(function() {
          new EmberApp({
            project: project
          });
        }).to.not.throw(/loader.js addon is missing/);
      });

      it('throws an error when loader.js is not present in registry.availablePlugins', function() {
        expect(function() {
          new EmberApp({
            project: project,
            registry: {
              add: function() { },
              availablePlugins: { }
            }
          });
        }).to.throw(/loader.js addon is missing/);
      });

      it('does not throw an error if _ignoreMissingLoader is set', function() {
        expect(function() {
          new EmberApp({
            project: project,
            registry: {
              add: function() { },
              availablePlugins: { }
            },
            _ignoreMissingLoader: true
          });
        }).to.not.throw(/loader.js addon is missing/);
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

        expect(calledConfig).to.deep.equal(config);
        expect(calledType).to.equal('foo');
        expect(actual).to.equal('blammo');
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

        expect(actual).to.equal('blammo\nblahzorz');
      });

      it('allows later addons to inspect previous content', function() {
        var calledContent;

        project.addons.push({
          contentFor: function() {
            return 'zero';
          }
        });

        project.addons.push({
          contentFor: function() {
            return 'one';
          }
        });

        project.addons.push({
          contentFor: function(type, config, content) {
            calledContent = content.slice();
            content.pop();
            return 'two';
          }
        });

        var actual = emberApp.contentFor(config, defaultMatch, 'foo');

        expect(calledContent).to.deep.equal(['zero', 'one']);
        expect(actual).to.equal('zero\ntwo');
      });
    });

    describe('contentFor("head")', function() {
      it('includes the `meta` tag in `head` by default', function() {
        var escapedConfig = escape(JSON.stringify(config));
        var metaExpected = '<meta name="cool-foo/config/environment" ' +
                           'data-module="true" content="' + escapedConfig + '" />';
        var actual = emberApp.contentFor(config, defaultMatch, 'head');

        expect(actual).to.contain(metaExpected);
      });

      it('does not include the `meta` tag in `head` if storeConfigInMeta is false', function() {
        emberApp.options.storeConfigInMeta = false;

        var escapedConfig = escape(JSON.stringify(config));
        var metaExpected = '<meta name="cool-foo/config/environment" ' +
                           'data-module="true" content="' + escapedConfig + '" />';
        var actual = emberApp.contentFor(config, defaultMatch, 'head');

        expect(actual).to.not.contain(metaExpected);
      });

      it('includes the `base` tag in `head` if locationType is auto', function() {
        config.locationType = 'auto';
        config.baseURL = '/';
        var expected = '<base href="/" />';
        var actual = emberApp.contentFor(config, defaultMatch, 'head');

        expect(actual).to.contain(expected);
      });

      it('includes the `base` tag in `head` if locationType is none (testem requirement)', function() {
        config.locationType = 'none';
        config.baseURL = '/';
        var expected = '<base href="/" />';
        var actual = emberApp.contentFor(config, defaultMatch, 'head');

        expect(actual).to.contain(expected);
      });

      it('does not include the `base` tag in `head` if locationType is hash', function() {
        config.locationType = 'hash';
        config.baseURL = '/foo/bar';
        var expected = '<base href="/foo/bar/" />';
        var actual = emberApp.contentFor(config, defaultMatch, 'head');

        expect(actual).to.not.contain(expected);
      });

      it('does not include the `base` tag in `head` if baseURL is undefined', function() {
        var expected = '<base href=';
        var actual = emberApp.contentFor(config, defaultMatch, 'head');

        expect(actual).to.not.contain(expected);
      });
    });

    describe('contentFor("app-config")', function() {
      it('includes the raw config if storeConfigInMeta is false', function() {
        emberApp.options.storeConfigInMeta = false;

        var expected = JSON.stringify(config);
        var actual = emberApp.contentFor(config, defaultMatch, 'app-config');

        expect(actual).to.contain(expected);
      });
    });

    describe('contentFor("app-boot")', function() {
      it('includes the meta module configs by default', function() {
        emberApp.options.autoRun = false;
        var expected = 'require(\'~ember-cli/config-modules\');';
        var actual = emberApp.contentFor(config, defaultMatch, 'app-boot');

        expect(actual).to.contain(expected);
      });
    });

    it('has no default value other than `head`', function() {
      expect(emberApp.contentFor(config, defaultMatch, 'foo')).to.equal('');
      expect(emberApp.contentFor(config, defaultMatch, 'body')).to.equal('');
      expect(emberApp.contentFor(config, defaultMatch, 'blah')).to.equal('');
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

        expect(called).to.be.true;
        expect(passedApp).to.equal(emberApp);
      });

      it('does not throw an error if the addon does not implement `included`', function() {
        delete addon.included;

        project.initializeAddons = function() {
          this.addons = [ addon ];
        };

        expect(function() {
          emberApp = new EmberApp({
            project: project
          });
        }).to.not.throw(/addon must implement the `included`/);
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

        expect(emberApp.addonTreesFor('blah')).to.deep.equal([]);
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

        expect(emberApp.addonTreesFor('blah')).to.deep.equal(['blazorz']);
        expect(actualTreeName).to.equal('blah');
      });

      it('addonTreesFor does not throw an error if treeFor is not defined', function() {
        delete addon.treeFor;

        emberApp = new EmberApp({
          project: project
        });

        expect(function() {
          emberApp.addonTreesFor('blah');
        }).not.to.throw(/addon must implement the `treeFor`/);
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

          expect(addonTreesForStub.calledWith[0][0]).to.equal('addon');
          expect(addonTreesForStub.calledWith[1][0]).to.equal('vendor');
        });

        it('_processedAppTree calls addonTreesFor', function() {
          emberApp._processedAppTree();

          expect(addonTreesForStub.calledWith[0][0]).to.equal('app');
        });
      });
    });

    describe('postprocessTree is called properly', function() {
      var postprocessTreeStub;
      beforeEach(function() {
        emberApp = new EmberApp({
          project: project
        });

        postprocessTreeStub = stub(emberApp, 'addonPostprocessTree', ['batman']);
      });


      it('styles calls addonTreesFor', function() {
        emberApp.styles();

        expect(postprocessTreeStub.calledWith[0][0]).to.equal('css');
        expect(postprocessTreeStub.calledWith[0][1].description).to.equal('styles', 'should be called with consolidated tree');
      });


      it('template type is called', function() {
        var oldLoad = emberApp.registry.load;
        emberApp.registry.load = function(type) {
          if (type === 'template') {
            return [
              {
                toTree: function() {
                  return {
                    description: 'template'
                  };
                }
              }];
          } else {
            return oldLoad.call(emberApp.registry, type);
          }
        };

        emberApp._processedTemplatesTree();
        expect(postprocessTreeStub.calledWith[0][0]).to.equal('template');
        expect(postprocessTreeStub.calledWith[0][1].description).to.equal('template', 'should be called with consolidated tree');
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

        expect(emberApp.toTree()).to.equal('derp');
      });

      it('calls addonPostprocessTree', function() {
        stub(emberApp, 'toArray', []);
        stub(emberApp, 'addonPostprocessTree', 'blap');

        expect(emberApp.toTree()).to.equal('blap');
      });

      it('calls each addon postprocessTree hook', function() {
        stub(emberApp, '_processedTemplatesTree', 'x');
        stub(addon, 'postprocessTree', 'blap');
        expect(emberApp.toTree()).to.equal('blap');
        expect(
          addon.postprocessTree.calledWith.map(function(args) {
            return args[0];
          }).sort()
        ).to.deep.equal(['all', 'css', 'js', 'test']);
      });

    });

    describe('addons can be disabled', function() {
      beforeEach(function() {
        projectPath = path.resolve(__dirname, '../../fixtures/addon/env-addons');
        var packageContents = require(path.join(projectPath, 'package.json'));
        project = new Project(projectPath, packageContents);
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
            emberApp = new EmberApp({ project: project });

            emberFooEnvAddonFixture.app = emberApp;
            expect(emberApp._addonEnabled(emberFooEnvAddonFixture)).to.be.false;

            expect(emberApp.project.addons.length).to.equal(8);
          });

          it('foo', function() {
            process.env.EMBER_ENV = 'foo';
            emberApp = new EmberApp({ project: project });

            emberFooEnvAddonFixture.app = emberApp;
            expect(emberApp._addonEnabled(emberFooEnvAddonFixture)).to.be.true;

            expect(emberApp.project.addons.length).to.equal(9);
          });
        });
      });

      describe('blacklist', function() {
        it('prevents addons to be added to the project', function() {
          process.env.EMBER_ENV = 'foo';
          emberApp = new EmberApp({
            project: project,
            addons: {
              blacklist: ['ember-foo-env-addon']
            }
          });

          expect(emberApp._addonDisabledByBlacklist({ name: 'ember-foo-env-addon' })).to.be.true;
          expect(emberApp._addonDisabledByBlacklist({ name: 'Ember Random Addon' })).to.be.false;
          expect(emberApp.project.addons.length).to.equal(8);
        });

        it('throws if unavailable addon is specified', function() {
          var load = function() {
            process.env.EMBER_ENV = 'foo';
            emberApp = new EmberApp({
              project: project,
              addons: {
                blacklist: ['ember-cli-self-troll']
              }
            });
          };

          expect(load).to.throw('Addon "ember-cli-self-troll" defined in blacklist is not found');
        });
      });

      describe('whitelist', function() {
        it('prevents non-whitelisted addons to be added to the project', function() {
          process.env.EMBER_ENV = 'foo';
          emberApp = new EmberApp({
            project: project,
            addons: {
              whitelist: ['ember-foo-env-addon']
            }
          });

          expect(emberApp._addonDisabledByWhitelist({ name: 'ember-foo-env-addon' })).to.be.false;
          expect(emberApp._addonDisabledByWhitelist({ name: 'Ember Random Addon' })).to.be.true;
          expect(emberApp.project.addons.length).to.equal(1);
        });

        it('throws if unavailable addon is specified', function() {
          var load = function() {
            process.env.EMBER_ENV = 'foo';
            emberApp = new EmberApp({
              project: project,
              addons: {
                whitelist: ['ember-cli-self-troll']
              }
            });
          };

          expect(load).to.throw('Addon "ember-cli-self-troll" defined in whitelist is not found');
        });
      });

      describe('blacklist wins over whitelist', function() {
        it('prevents addon to be added to the project', function() {
          process.env.EMBER_ENV = 'foo';
          emberApp = new EmberApp({
            project: project,
            addons: {
              whitelist: ['ember-foo-env-addon'],
              blacklist: ['ember-foo-env-addon']
            }
          });

          expect(emberApp.project.addons.length).to.equal(0);
        });
      });
    });

    describe('addonLintTree', function() {
      beforeEach(function() {
        addon = { };

        project.initializeAddons = function() {
          this.addons = [ addon ];
        };

        emberApp = new EmberApp({
          project: project
        });
      });

      it('does not throw an error if lintTree is not defined', function() {
        emberApp.addonLintTree();
      });

      it('calls lintTree on the addon', function() {
        var actualType, actualTree;

        addon.lintTree = function(type, tree) {
          actualType = type;
          actualTree = tree;

          return 'blazorz';
        };

        var assertionsWereRun;

        mergeTreesStub = function(inputTree, options) {
          expect(inputTree).to.deep.equal(['blazorz']);
          expect(options).to.deep.equal({
            overwrite: true,
            annotation: 'TreeMerger (lint blah)'
          });

          assertionsWereRun = true;
        };

        emberApp.addonLintTree('blah', 'blam');

        expect(actualType).to.equal('blah');
        expect(actualTree).to.equal('blam');
        expect(assertionsWereRun).to.be.true;
      });

      it('filters out tree if lintTree returns falsey', function() {
        addon.lintTree = function() {
          return false;
        };

        var assertionsWereRun;

        mergeTreesStub = function(inputTree) {
          expect(inputTree.length).to.equal(0);

          assertionsWereRun = true;
        };

        emberApp.addonLintTree();

        expect(assertionsWereRun).to.be.true;
      });
    });
  });

  describe('import', function() {
    it('appends dependencies to vendor by default', function() {
      emberApp = new EmberApp({
        project: project
      });
      emberApp.import('vendor/moment.js');
      var outputFile = emberApp._scriptOutputFiles['/assets/vendor.js'];

      expect(outputFile).to.be.instanceof(Array);
      expect(outputFile.indexOf('vendor/moment.js')).to.equal(outputFile.length - 1);
    });
    it('appends dependencies', function() {
      emberApp = new EmberApp({
        project: project
      });
      emberApp.import('vendor/moment.js', {type: 'vendor'});

      var outputFile = emberApp._scriptOutputFiles['/assets/vendor.js'];

      expect(outputFile).to.be.instanceof(Array);
      expect(outputFile.indexOf('vendor/moment.js')).to.equal(outputFile.length - 1);
    });
    it('prepends dependencies', function() {
      emberApp = new EmberApp({
        project: project
      });
      emberApp.import('vendor/es5-shim.js', {type: 'vendor', prepend: true});

      var outputFile = emberApp._scriptOutputFiles['/assets/vendor.js'];

      expect(outputFile).to.be.instanceof(Array);
      expect(outputFile.indexOf('vendor/es5-shim.js')).to.equal(0);
    });
    it('prepends dependencies to outputFile', function() {
      emberApp = new EmberApp({
        project: project
      });
      emberApp.import('vendor/moment.js', {outputFile: 'moment.js', prepend: true});

      var outputFile = emberApp._scriptOutputFiles['moment.js'];

      expect(outputFile).to.be.instanceof(Array);
      expect(outputFile.indexOf('vendor/moment.js')).to.equal(0);
    });
    it('appends dependencies to outputFile', function() {
      emberApp = new EmberApp({
        project: project
      });
      emberApp.import('vendor/moment.js', {outputFile: 'moment.js'});

      var outputFile = emberApp._scriptOutputFiles['moment.js'];

      expect(outputFile).to.be.instanceof(Array);
      expect(outputFile.indexOf('vendor/moment.js')).to.equal(outputFile.length - 1);
    });

    it('defaults to development if production is not set', function() {
      process.env.EMBER_ENV = 'production';
      emberApp = new EmberApp({
        project: project
      });
      emberApp.import({
        'development': 'vendor/jquery.js'
      });
      var outputFile = emberApp._scriptOutputFiles['/assets/vendor.js'];
      expect(outputFile.indexOf('vendor/jquery.js')).to.equal(outputFile.length - 1);
      process.env.EMBER_ENV = undefined;
    });
    it('honors explicitly set to null in environment', function() {
      process.env.EMBER_ENV = 'production';
      emberApp = new EmberApp({
        project: project
      });
      emberApp.import({
        'development': 'vendor/jquery.js',
        'production':  null
      });
      expect(emberApp._scriptOutputFiles['/assets/vendor.js']).to.not.contain('vendor/jquery.js');
      process.env.EMBER_ENV = undefined;
    });
  });

  describe('vendorFiles', function() {
    var defaultVendorFiles = [
      'jquery.js',
      'ember.js',
      'app-shims.js'
    ];

    describe('handlebars.js', function() {
      it('does not app.import handlebars if not present in bower.json', function() {
        var app = new EmberApp({
          project: project
        });

        expect(app.vendorFiles).not.to.include.keys('handlebars.js');
      });

      it('includes handlebars if present in bower.json', function() {
        projectPath = path.resolve(__dirname, '../../fixtures/project-with-handlebars');
        project = setupProject(projectPath);

        var app = new EmberApp({
          project: project
        });

        expect(app.vendorFiles).to.include.keys('handlebars.js');
      });

      it('includes handlebars if present in provided `vendorFiles`', function() {
        var app = new EmberApp({
          project: project,
          vendorFiles: {
            'handlebars.js': 'some/path/whatever.js'
          }
        });

        expect(app.vendorFiles).to.include.keys('handlebars.js');
      });
    });

    it('defines vendorFiles by default', function() {
      emberApp = new EmberApp({
        project: project
      });
      expect(Object.keys(emberApp.vendorFiles)).to.deep.equal(defaultVendorFiles);
    });

    it('redefines a location of a vendor asset', function() {
      emberApp = new EmberApp({
        project: project,

        vendorFiles: {
          'ember.js': 'vendor/ember.js'
        }
      });
      expect(emberApp.vendorFiles['ember.js']).to.equal('vendor/ember.js');
    });

    it('defines vendorFiles in order even when option for it is passed', function() {
      emberApp = new EmberApp({
        project: project,

        vendorFiles: {
          'ember.js': 'vendor/ember.js'
        }
      });
      expect(Object.keys(emberApp.vendorFiles)).to.deep.equal(defaultVendorFiles);
    });

    it('removes dependency in vendorFiles', function() {
      emberApp = new EmberApp({
        project: project,

        vendorFiles: {
          'ember.js': null,
          'handlebars.js': null
        }
      });
      var vendorFiles = Object.keys(emberApp.vendorFiles);
      expect(vendorFiles).to.not.contain('ember.js');
      expect(vendorFiles).to.not.contain('handlebars.js');
    });

    it('defaults to ember.debug.js if exists in bower_components', function () {
      var root = path.resolve(__dirname, '../../fixtures/app/with-default-ember-debug');

      emberApp = new EmberApp({
        project: setupProject(root)
      });

      var emberFiles = emberApp.vendorFiles['ember.js'];
      expect(emberFiles.development).to.equal('bower_components/ember/ember.debug.js');
    });

    it('switches the default ember.debug.js to ember.js if it does not exist', function () {
      var root = path.resolve(__dirname, '../../fixtures/app/without-ember-debug');

      emberApp = new EmberApp({
        project: setupProject(root)
      });

      var emberFiles = emberApp.vendorFiles['ember.js'];
      expect(emberFiles.development).to.equal('bower_components/ember/ember.js');
    });

    it('does not clobber an explicitly configured ember development file', function () {
      emberApp = new EmberApp({
        project: project,

        vendorFiles: {
          'ember.js': {
            development: 'vendor/ember.debug.js'
          }
        }
      });
      var emberFiles = emberApp.vendorFiles['ember.js'];
      expect(emberFiles.development).to.equal('vendor/ember.debug.js');
    });
  });

  describe('_resolveLocal', function() {
    it('resolves a path relative to the project root', function() {
      var emberApp = new EmberApp({
        project: project
      });

      var result = emberApp._resolveLocal('foo');
      expect(result).to.equal(path.join(project.root, 'foo'));
    });
  });

  describe('concatFiles()', function() {
    it('shows deprecation message if called directly', function() {
      var emberApp = new EmberApp({ project: project });

      var result = emberApp.concatFiles(null, {
        outputFile: 'foo.js'
      });

      expect(project.ui.output).to.contain('EmberApp.concatFiles() is deprecated');
    });

    it('ignores deprecation message if called through _concatFiles()', function() {
      var emberApp = new EmberApp({ project: project });

      var result = emberApp._concatFiles(null, {
        outputFile: 'foo.js'
      });

      expect(project.ui.output).to.not.contain('EmberApp.concatFiles() is deprecated');
    });
  });
});

