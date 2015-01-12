'use strict';

var fs      = require('fs');
var path    = require('path');
var Project = require('../../../lib/models/project');
var Addon   = require('../../../lib/models/addon');
var Promise = require('../../../lib/ext/promise');
var expect  = require('chai').expect;
var rimraf  = Promise.denodeify(require('rimraf'));
var tmp     = require('tmp-sync');
var path    = require('path');

var root    = process.cwd();
var tmproot = path.join(root, 'tmp');

var fixturePath = path.resolve(__dirname, '../../fixtures/addon');

describe('models/addon.js', function() {
  var addon, project, projectPath;

  describe('treePaths and treeForMethods', function() {
    var FirstAddon, SecondAddon;

    beforeEach(function() {
      projectPath = path.resolve(fixturePath, 'simple');
      var packageContents = require(path.join(projectPath, 'package.json'));

      project = new Project(projectPath, packageContents);

      FirstAddon = Addon.extend({
        name: 'first',

        init: function() {
          this.treePaths.vendor = 'blazorz';
          this.treeForMethods.public = 'huzzah!';
        }
      });

      SecondAddon = Addon.extend({
        name: 'first',

        init: function() {
          this.treePaths.vendor = 'blammo';
          this.treeForMethods.public = 'boooo';
        }
      });

    });

    describe('.jshintAddonTree', function() {
      it('it uses the fullPath', function() {
        var addon = new FirstAddon(project);

        // TODO: fix config story...
        addon.app = { options: { jshintrc: {} } };

        addon.jshintTrees = function(){};
        addon.pickFiles   = function(){};

        var addonPath;
        addon.addonJsFiles = function(_path) {
          addonPath = _path;
        };

        var root = path.join(fixturePath, 'with-styles');
        addon.root = root;

        addon.jshintAddonTree();
        expect(addonPath).to.eql(path.join(root, 'addon'));
      });
    });


    it('modifying a treePath does not affect other addons', function() {
      var first = new FirstAddon(project);
      var second = new SecondAddon(project);

      expect(first.treePaths.vendor).to.equal('blazorz');
      expect(second.treePaths.vendor).to.equal('blammo');
    });

    it('modifying a treeForMethod does not affect other addons', function() {
      var first = new FirstAddon(project);
      var second = new SecondAddon(project);

      expect(first.treeForMethods.public).to.equal('huzzah!');
      expect(second.treeForMethods.public).to.equal('boooo');
    });
  });

  describe('resolvePath', function() {
    before(function() {
      addon = {
        pkg: {
          'ember-addon': {
            'main': ''
          }
        },
        path: ''
      };
    });

    it('adds .js if not present', function() {
      addon.pkg['ember-addon']['main'] = 'index';
      var resolvedFile = path.basename(Addon.resolvePath(addon));
      expect(resolvedFile).to.equal('index.js');
    });

    it('doesn\'t add .js if it is .js', function() {
      addon.pkg['ember-addon']['main'] = 'index.js';
      var resolvedFile = path.basename(Addon.resolvePath(addon));
      expect(resolvedFile).to.equal('index.js');
    });

    it('doesn\'t add .js if it has another extension', function() {
      addon.pkg['ember-addon']['main'] = 'index.coffee';
      var resolvedFile = path.basename(Addon.resolvePath(addon));
      expect(resolvedFile).to.equal('index.coffee');
    });
  });

  describe('initialized addon', function() {
    before(function() {
      projectPath = path.resolve(fixturePath, 'simple');
      var packageContents = require(path.join(projectPath, 'package.json'));

      project = new Project(projectPath, packageContents);
      project.initializeAddons();
    });

    describe('generated addon no-export', function() {
      before(function() {
        addon = project.addons[7];
      });

      it('sets it\'s project', function() {
        expect(addon.project.name).to.equal(project.name);
      });

      it('sets the root', function() {
        expect(addon.root).to.not.equal(undefined);
      });

      it('sets the pkg', function() {
        expect(addon.pkg).to.not.equal(undefined);
      });

      describe('custom treeFor methods', function() {
        it('can define treeForApp', function() {
          var called;

          addon.treeForApp = function() {
            called = true;
          };

          addon.treeFor('app');
          expect(called);
        });

        it('can define treeForStyles', function() {
          var called;

          addon.treeForStyles = function() {
            called = true;
          };

          addon.treeFor('styles');
          expect(called);
        });

        it('can define treeForVendor', function() {
          var called;

          addon.treeForVendor = function() {
            called = true;
          };

          addon.treeFor('vendor');
          expect(called);
        });

        it('can define treeForTemplates', function() {
          var called;

          addon.treeForTemplates = function() {
            called = true;
          };

          addon.treeFor('templates');
          expect(called);
        });

        it('can define treeForPublic', function() {
          var called;

          addon.treeForPublic = function() {
            called = true;
          };

          addon.treeFor('public');
          expect(called);
        });
      });

      describe('trees for it\'s treePaths', function() {
        it('app', function() {
          var tree = addon.treeFor('app');

          expect(typeof tree.read).to.equal('function');
        });

        it('styles', function() {
          var tree = addon.treeFor('styles');
          expect(typeof tree.read).to.equal('function');
        });

        it('templates', function() {
          var tree = addon.treeFor('templates');
          expect(typeof tree.read).to.equal('function');
        });

        it('vendor', function() {
          var tree = addon.treeFor('vendor');
          expect(typeof tree.read).to.equal('function');
        });

        it('public', function() {
          var tree = addon.treeFor('public');
          expect(typeof tree.read).to.equal('function');
        });
      });
    });

    describe('generated addon with-export', function() {
      beforeEach(function() {
        addon = project.addons[4];

        // Clear the caches
        delete addon._includedModules;
        delete addon._moduleName;
      });

      it('sets it\'s project', function() {
        expect(addon.project.name).to.equal(project.name);
      });

      it('generates a list of es6 modules to ignore', function() {
        expect(addon.includedModules()).to.deep.equal({
          'ember-cli-generated-with-export/controllers/people': ['default'],
          'ember-cli-generated-with-export/mixins/thing': ['default']
        });
      });

      it('generates a list of es6 modules to ignore with custom modulePrefix', function() {
        addon.modulePrefix = 'custom-addon';

        expect(addon.includedModules()).to.deep.equal({
          'custom-addon/controllers/people': ['default'],
          'custom-addon/mixins/thing': ['default']
        });

        delete addon.modulePrefix;
      });

      it('sets the root', function() {
        expect(addon.root).to.not.equal(undefined);
      });

      it('sets the pkg', function() {
        expect(addon.pkg).to.not.equal(undefined);
      });

      describe('trees for it\'s treePaths', function() {
        it('app', function() {
          var tree = addon.treeFor('app');
          expect(typeof tree.read).to.equal('function');
        });

        it('styles', function() {
          var tree = addon.treeFor('styles');
          expect(typeof tree.read).to.equal('function');
        });

        it('templates', function() {
          var tree = addon.treeFor('templates');
          expect(typeof tree.read).to.equal('function');
        });

        it('vendor', function() {
          var tree = addon.treeFor('vendor');
          expect(typeof tree.read).to.equal('function');
        });

        it('addon', function() {
          var app = {
            importWhitelist: {},
            options: {},
          };
          addon.registry = {
            app: addon,
            load: function() {
              return [{
                toTree: function(tree) {
                  return tree;
                }
              }];
            },

            extensionsForType: function() {
              return ['js'];
            }
          };
          addon.app = app;
          var tree = addon.treeFor('addon');
          expect(typeof tree.read).to.equal('function');
        });
      });
    });

    it('must define a `name` property', function() {
      var Foo = Addon.extend({ root: 'foo' });

      expect(function() {
        new Foo(project);
      }).to.throw(/An addon must define a `name` property./);
    });

    describe('isDevelopingAddon', function() {
      var originalEnvValue;

      beforeEach(function() {
        originalEnvValue = process.env.EMBER_ADDON_ENV;
      });

      afterEach(function() {
        process.env.EMBER_ADDON_ENV = originalEnvValue;
      });

      it('returns true when `EMBER_ADDON_ENV` is set to development', function() {
        process.env.EMBER_ADDON_ENV = 'development';

        expect(addon.isDevelopingAddon());
      });

      it('returns false when `EMBER_ADDON_ENV` is not set', function() {
        delete process.env.EMBER_ADDON_ENV;

        expect(!addon.isDevelopingAddon());
      });

      it('returns false when `EMBER_ADDON_ENV` is something other than `development`', function() {
        process.env.EMBER_ADDON_ENV = 'production';

        expect(!addon.isDevelopingAddon());
      });
    });

    describe('treeGenerator', function() {
      it('watch tree when developing the addon itself', function() {
        addon.isDevelopingAddon = function() { return true; };

        var tree = addon.treeGenerator('foo/bar');

        expect(tree).to.equal('foo/bar');
      });

      it('uses unwatchedTree when not developing the addon itself', function() {
        addon.isDevelopingAddon = function() { return false; };

        var tree = addon.treeGenerator('foo/bar');

        expect(tree.read()).to.equal('foo/bar');
      });
    });

    describe('blueprintsPath', function() {
      var tmpdir;

      beforeEach(function() {
        tmpdir  = tmp.in(tmproot);

        addon.root = tmpdir;
      });

      afterEach(function() {
        return rimraf(tmproot);
      });

      it('returns undefined if the `blueprint` folder does not exist', function() {
        var returnedPath = addon.blueprintsPath();

        expect(returnedPath).to.equal(undefined);
      });

      it('returns blueprint path if the folder exists', function() {
        var blueprintsDir = path.join(tmpdir, 'blueprints');
        fs.mkdirSync(blueprintsDir);

        var returnedPath = addon.blueprintsPath();

        expect(returnedPath).to.equal(blueprintsDir);
      });
    });

    describe('config', function() {
      it('returns undefined if `config/environment.js` does not exist', function() {
        addon.root = path.join(fixturePath, 'no-config');
        var result = addon.config();

        expect(result).to.equal(undefined);
      });

      it('returns blueprint path if the folder exists', function() {
        addon.root = path.join(fixturePath, 'with-config');
        var appConfig = {};

        addon.config('development', appConfig);

        expect(appConfig.addon).to.equal('with-config');
      });
    });
  });
});
