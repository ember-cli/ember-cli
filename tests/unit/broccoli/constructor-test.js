'use strict';

var path     = require('path');
var Project  = require('../../../lib/models/project');
var EmberApp = require('../../../lib/broccoli/ember-app');
var assert   = require('assert');

describe('broccoli/ember-app', function() {
  var project, projectPath;

  describe('constructor', function() {
    beforeEach(function() {
      projectPath = path.resolve(__dirname, '../../fixtures/project');
      var packageContents = require(path.join(projectPath, 'package.json'));

      project = new Project(projectPath, packageContents);
      project.require = function() {
        return function() {};
      };
      project.initializeAddons = function() {
        this.addons = [];
      };
    });

    it('allows override', function() {
      var emberApp = new EmberApp({
        project: project,
        root: '/Other'
      });

      assert.equal(emberApp.project.root, '/Other');
    });
  });
});
