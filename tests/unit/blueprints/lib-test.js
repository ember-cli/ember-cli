'use strict';

var path = require('path');
var blueprintHelpers = require('ember-cli-blueprint-test-helpers/helpers');
var setupTestHooks = blueprintHelpers.setupTestHooks;
var emberNew = blueprintHelpers.emberNew;
var emberGenerateDestroy = blueprintHelpers.emberGenerateDestroy;
var modifyPackages = blueprintHelpers.modifyPackages;

var expect = require('ember-cli-blueprint-test-helpers/chai').expect;
var dir = require('chai-files').dir;

describe('Acceptance: ember generate and destroy lib', function() {
  setupTestHooks(this, {
    cliPath: path.resolve(__dirname + '/../../..'),
  });

  it('lib foo', function() {
    var args = ['lib', 'foo'];

    return emberNew()
      .then(function() {
        return emberGenerateDestroy(args, function(file) {
          expect(dir('lib')).to.exist;
          expect(file('lib/.jshintrc')).to.exist;
        });
      });
  });

  it('lib foo without ember-cli-jshint', function() {
    var args = ['lib', 'foo'];

    return emberNew()
      .then(function() {
        return modifyPackages([
          {name: 'ember-cli-jshint', delete: true},
        ]);
      })
      .then(function() {
        return emberGenerateDestroy(args, function(file) {
          expect(dir('lib')).to.exist;
          expect(file('lib/.jshintrc')).to.not.exist;
        });
      });
  });
});
