'use strict';

var path    = require('path');
var Project = require('../../../lib/models/project');
var Addon = require('../../../lib/models/addon');
var assert  = require('assert');

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
  });
});
