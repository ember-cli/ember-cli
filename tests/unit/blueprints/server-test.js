'use strict';

const path = require('path');
const {
  emberNew,
  emberGenerate,
  modifyPackages,
  setupTestHooks,
} = require('ember-cli-blueprint-test-helpers/helpers');

const { file, expect } = require('ember-cli-blueprint-test-helpers/chai');

describe('Acceptance: ember generate and destroy server', function() {
  setupTestHooks(this, {
    cliPath: path.resolve(`${__dirname}/../../..`),
  });

  it('server', function() {
    let args = ['server'];

    return emberNew()
      .then(() => emberGenerate(args))
      .then(() => {
        expect(file('server/index.js')).to.contain('module.exports = function(app) {');
        expect(file('server/.jshintrc')).to.not.exist;

        // TODO: assert that `morgan` and `glob` dependencies were installed
      });
  });

  it('server with ember-cli-jshint', function() {
    let args = ['server'];

    return emberNew()
      .then(() => modifyPackages([
        { name: 'ember-cli-jshint', dev: true },
      ]))
      .then(() => emberGenerate(args))
      .then(() => {
        expect(file('server/.jshintrc')).to.exist;
      });
  });
});
