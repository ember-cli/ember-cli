'use strict';

const path = require('path');
const {
  emberNew,
  setupTestHooks,
  modifyPackages,
  emberGenerateDestroy,
} = require('ember-cli-blueprint-test-helpers/helpers');

const { dir } = require('chai-files');
const { expect } = require('ember-cli-blueprint-test-helpers/chai');

describe('Acceptance: ember generate and destroy packages', function() {
  setupTestHooks(this, {
    cliPath: path.resolve(`${__dirname}/../../..`),
  });

  it('packages foo', function() {
    let args = ['packages', 'foo'];

    return emberNew()
      .then(() => emberGenerateDestroy(args, file => {
        expect(dir('packages')).to.exist;
        expect(file('packages/.jshintrc')).to.not.exist;
      }));
  });

  it('packages foo with ember-cli-jshint', function() {
    let args = ['packages', 'foo'];

    return emberNew()
      .then(() => modifyPackages([
        { name: 'ember-cli-jshint', dev: true },
      ]))
      .then(() => emberGenerateDestroy(args, file => {
        expect(dir('packages')).to.exist;
        expect(file('packages/.jshintrc')).to.exist;
      }));
  });
});
