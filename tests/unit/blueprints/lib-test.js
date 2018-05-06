'use strict';

const path = require('path');
const {
  emberNew,
  modifyPackages,
  setupTestHooks,
  emberGenerateDestroy,
} = require('ember-cli-blueprint-test-helpers/helpers');

const { dir, expect } = require('ember-cli-blueprint-test-helpers/chai');

describe('Acceptance: ember generate and destroy lib', function() {
  setupTestHooks(this, {
    cliPath: path.resolve(`${__dirname}/../../..`),
  });

  it('lib foo', function() {
    let args = ['lib', 'foo'];

    return emberNew()
      .then(() => emberGenerateDestroy(args, file => {
        expect(dir('lib')).to.exist;
        expect(file('lib/.jshintrc')).to.not.exist;
      }));
  });

  it('lib foo with ember-cli-jshint', function() {
    let args = ['lib', 'foo'];

    return emberNew()
      .then(() => modifyPackages([
        { name: 'ember-cli-jshint', dev: true },
      ]))
      .then(() => emberGenerateDestroy(args, file => {
        expect(dir('lib')).to.exist;
        expect(file('lib/.jshintrc')).to.exist;
      }));
  });
});
