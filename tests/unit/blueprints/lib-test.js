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
  return;
  setupTestHooks(this, {
    cliPath: path.resolve(__dirname + '/../../..'),
  });

  it('lib foo', function() {
    var args = ['lib', 'foo'];

    return emberNew()
      .then(function() {
        return emberGenerateDestroy(args, function(file) {
          expect(dir('lib')).to.exist;
          expect(file('lib/.jshintrc')).to.not.exist;
        });
      });
  });

  it('lib foo with ember-cli-jshint', function() {
    var args = ['lib', 'foo'];

    return emberNew()
      .then(function() {
        return modifyPackages([
          {name: 'ember-cli-jshint', dev: true},
        ]);
      })
      .then(function() {
        return emberGenerateDestroy(args, function(file) {
          expect(dir('lib')).to.exist;
          expect(file('lib/.jshintrc')).to.exist;
        });
      });
  });
});
