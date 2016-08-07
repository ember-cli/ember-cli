'use strict';

var path = require('path');
var blueprintHelpers = require('ember-cli-blueprint-test-helpers/helpers');
var setupTestHooks = blueprintHelpers.setupTestHooks;
var emberNew = blueprintHelpers.emberNew;
var emberGenerateDestroy = blueprintHelpers.emberGenerateDestroy;
var emberGenerate = blueprintHelpers.emberGenerate;
var emberDestroy = blueprintHelpers.emberDestroy;
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

  it('should remove lib directory on destroy if lib empty', function() {
    var args = ['in-repo-addon', 'fooBar'];

    return emberNew()
      .then(function() {
        return emberGenerate(args);
      })
      .then(function() {
        return emberDestroy(args);
      })
      .then(function() {
        expect(dir('lib')).to.not.exist;
      });
  });

  it('should not remove lib directory on destroy if lib not empty', function() {
    var args = ['in-repo-addon', 'fooBar'];
    var secondArgs = ['in-repo-addon', 'bazQuux'];

    return emberNew()
      .then(function() {
        return emberGenerate(args);
      })
      .then(function() {
        return emberGenerate(secondArgs);
      })
      .then(function() {
        return emberDestroy(args);
      })
      .then(function() {
        expect(dir('lib')).to.exist;
        expect(dir('lib/foo-bar')).to.not.exist;
        expect(dir('lib/baz-quux')).to.exist;
      });
  });
});
