'use strict';

let path = require('path');
let blueprintHelpers = require('ember-cli-blueprint-test-helpers/helpers');
let setupTestHooks = blueprintHelpers.setupTestHooks;
let emberNew = blueprintHelpers.emberNew;
let emberGenerateDestroy = blueprintHelpers.emberGenerateDestroy;
let modifyPackages = blueprintHelpers.modifyPackages;

let expect = require('ember-cli-blueprint-test-helpers/chai').expect;
let dir = require('chai-files').dir;

describe('Acceptance: ember generate and destroy lib', function() {
  setupTestHooks(this, {
    cliPath: path.resolve(`${__dirname}/../../..`),
  });

  it('lib foo', function() {
    let args = ['lib', 'foo'];

    return emberNew()
      .then(function() {
        return emberGenerateDestroy(args, function(file) {
          expect(dir('lib')).to.exist;
          expect(file('lib/.jshintrc')).to.not.exist;
        });
      });
  });

  it('lib foo with ember-cli-jshint', function() {
    let args = ['lib', 'foo'];

    return emberNew()
      .then(function() {
        return modifyPackages([
          { name: 'ember-cli-jshint', dev: true },
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
