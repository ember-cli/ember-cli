'use strict';

var fs      = require('fs');
var path    = require('path');
var Project = require('../../../lib/models/project');
var Addon = require('../../../lib/models/addon');
var assert  = require('assert');
var rimraf  = require('rimraf');
var tmp     = require('tmp-sync');

var root    = process.cwd();
var tmproot = path.join(root, 'tmp');


describe('models/addon.js', function() {
  var addon, project, projectPath;

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
      assert.equal(resolvedFile, 'index.js');
    });

    it('doesn\'t add .js if it is .js', function() {
      addon.pkg['ember-addon']['main'] = 'index.js';
      var resolvedFile = path.basename(Addon.resolvePath(addon));
      assert.equal(resolvedFile, 'index.js');
    });

    it('doesn\'t add .js if it has another extension', function() {
      addon.pkg['ember-addon']['main'] = 'index.coffee';
      var resolvedFile = path.basename(Addon.resolvePath(addon));
      assert.equal(resolvedFile, 'index.coffee');
    });
  });

  describe('initialized addon', function() {
    before(function() {
      projectPath = path.resolve(__dirname, '../../fixtures/addon/simple');
      var packageContents = require(path.join(projectPath, 'package.json'));

      project = new Project(projectPath, packageContents);
      project.initializeAddons();
    });

    describe('generated addon no-export', function() {
      before(function() {
        addon = project.addons[6];
      });

      it('sets it\'s project', function() {
        assert.equal(addon.project.name, project.name);
      });

      it('sets the root', function() {
        assert.notEqual(addon.root, undefined);
      });

      describe('trees for it\'s treePaths', function() {
        it('app', function() {
          var tree = addon.treeFor('app');
          assert.equal(typeof tree.read, 'function');
        });

        it('styles', function() {
          var tree = addon.treeFor('styles');
          assert.equal(typeof tree.read, 'function');
        });

        it('templates', function() {
          var tree = addon.treeFor('templates');
          assert.equal(typeof tree.read, 'function');
        });

        it('vendor', function() {
          var tree = addon.treeFor('vendor');
          assert.equal(typeof tree.read, 'function');
        });
      });
    });

    describe('generated addon with-export', function() {
      before(function() {
        addon = project.addons[5];
      });

      it('sets it\'s project', function() {
        assert.equal(addon.project.name, project.name);
      });

      it('sets the app if included', function() {
        addon.included('app');
        assert.equal(addon.app, 'app');
      });

      it('generates a list of es6 modules to ignore', function() {
        assert.deepEqual(addon.includedModules(), {
          'ember-cli-generated-with-export/controllers/people': ['default'],
          'ember-cli-generated-with-export/mixins/thing': ['default']
        });
      });

      it('sets the root', function() {
        assert.notEqual(addon.root, undefined);
      });

      describe('trees for it\'s treePaths', function() {
        it('app', function() {
          var tree = addon.treeFor('app');
          assert.equal(typeof tree.read, 'function');
        });

        it('styles', function() {
          var tree = addon.treeFor('styles');
          assert.equal(typeof tree.read, 'function');
        });

        it('templates', function() {
          var tree = addon.treeFor('templates');
          assert.equal(typeof tree.read, 'function');
        });

        it('vendor', function() {
          var tree = addon.treeFor('vendor');
          assert.equal(typeof tree.read, 'function');
        });

        it('addon', function() {
          var app = {
            importWhitelist: {},
            options: {},
          };
          addon.registry = {
            app: addon,
            load: function() {
              return {
                toTree: function(tree) {
                  return tree;
                }
              };
            },
          };
          addon.included(app);
          var tree = addon.treeFor('addon');
          assert.equal(typeof tree.read, 'function');
        });
      });
    });

    it('must define a `name` property', function() {
      var Foo = Addon.extend({ root: 'foo' });

      assert.throws(function() {
        new Foo(project);
      },
      /An addon must define a `name` property./ );
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

        assert(addon.isDevelopingAddon());
      });

      it('returns false when `EMBER_ADDON_ENV` is not set', function() {
        delete process.env.EMBER_ADDON_ENV;

        assert(!addon.isDevelopingAddon());
      });

      it('returns false when `EMBER_ADDON_ENV` is something other than `development`', function() {
        process.env.EMBER_ADDON_ENV = 'production';

        assert(!addon.isDevelopingAddon());
      });
    });

    describe('treeGenerator', function() {
      it('watch tree when developing the addon itself', function() {
        addon.isDevelopingAddon = function() { return true; };

        var tree = addon.treeGenerator('foo/bar');

        assert.equal(tree, 'foo/bar');
      });

      it('uses unwatchedTree when not developing the addon itself', function() {
        addon.isDevelopingAddon = function() { return false; };

        var tree = addon.treeGenerator('foo/bar');

        assert.equal(tree.read(), 'foo/bar');
      });
    });

    describe('blueprintsPath', function() {
      var tmpdir;

      beforeEach(function() {
        tmpdir  = tmp.in(tmproot);

        addon.root = tmpdir;
      });

      afterEach(function() {
        rimraf.sync(tmproot);
      });

      it('returns undefined if the `blueprint` folder does not exist', function() {
        var returnedPath = addon.blueprintsPath();

        assert.equal(returnedPath, undefined);
      });

      it('returns blueprint path if the folder exists', function() {
        var blueprintsDir = path.join(tmpdir, 'blueprints');
        fs.mkdirSync(blueprintsDir);

        var returnedPath = addon.blueprintsPath();

        assert.equal(returnedPath, blueprintsDir);
      });
    });
  });
});
