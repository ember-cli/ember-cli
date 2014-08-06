'use strict';

var path     = require('path');
var Project  = require('../../../lib/models/project');
var EmberApp = require('../../../lib/broccoli/ember-app');
var assert   = require('assert');
var stub     = require('../../helpers/stub').stub;

describe('broccoli/ember-app', function() {
  var project, projectPath, emberApp, addonTreesForStub, addon;

  describe('addons', function() {
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
          assert(trees.inputTrees[0].inputTree.inputTree.inputTrees.indexOf('batman') !== -1, 'contains addon tree');
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
  });
});
