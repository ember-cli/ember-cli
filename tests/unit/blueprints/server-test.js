'use strict';

var fs = require('fs-extra');
var path = require('path');
var blueprintHelpers = require('ember-cli-blueprint-test-helpers/helpers');
var setupTestHooks = blueprintHelpers.setupTestHooks;
var emberNew = blueprintHelpers.emberNew;
var emberGenerate = blueprintHelpers.emberGenerate;
var modifyPackages = blueprintHelpers.modifyPackages;

var chai = require('ember-cli-blueprint-test-helpers/chai');
var expect = chai.expect;
var file = chai.file;

describe('Acceptance: ember generate and destroy server', function() {
  setupTestHooks(this, {
    cliPath: path.resolve(__dirname + '/../../..'),
  });

  it('server', function() {
    var args = ['server'];

    return emberNew()
      .then(function() {
        return emberGenerate(args);
      })
      .then(function() {
        expect(file('server/index.js')).to.contain('module.exports = function(app) {');
        expect(file('server/.jshintrc')).to.not.exist;

        // TODO: assert that `morgan` and `glob` dependencies were installed
      });
  });

  it('server with ember-cli-jshint', function() {
    var args = ['server'];

    return emberNew()
      .then(function() {
        return modifyPackages([
          {name: 'ember-cli-jshint', dev: true},
        ]);
      })
      .then(function() {
        return emberGenerate(args);
      })
      .then(function() {
        expect(file('server/.jshintrc')).to.exist;
      });
  });
});
