'use strict';

let fs = require('fs-extra');
let path = require('path');
let blueprintHelpers = require('ember-cli-blueprint-test-helpers/helpers');
let setupTestHooks = blueprintHelpers.setupTestHooks;
let emberNew = blueprintHelpers.emberNew;
let emberGenerate = blueprintHelpers.emberGenerate;
let modifyPackages = blueprintHelpers.modifyPackages;

let chai = require('ember-cli-blueprint-test-helpers/chai');
let expect = chai.expect;
let file = chai.file;

describe('Acceptance: ember generate and destroy server', function() {
  setupTestHooks(this, {
    cliPath: path.resolve(`${__dirname}/../../..`),
  });

  it('server', function() {
    let args = ['server'];

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
    let args = ['server'];

    return emberNew()
      .then(function() {
        return modifyPackages([
          { name: 'ember-cli-jshint', dev: true },
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
