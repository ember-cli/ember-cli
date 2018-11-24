'use strict';

const path = require('path');
const blueprintHelpers = require('ember-cli-blueprint-test-helpers/helpers');
let setupTestHooks = blueprintHelpers.setupTestHooks;
let emberNew = blueprintHelpers.emberNew;
let emberGenerateDestroy = blueprintHelpers.emberGenerateDestroy;
let modifyPackages = blueprintHelpers.modifyPackages;

const expect = require('ember-cli-blueprint-test-helpers/chai').expect;
const dir = require('chai-files').dir;

describe('Acceptance: ember generate and destroy packages', function() {
  setupTestHooks(this, {
    cliPath: path.resolve(`${__dirname}/../../..`),
  });

  it('packages foo', function() {
    let args = ['packages', 'foo'];

    return emberNew()
      .then(() => emberGenerateDestroy(args, file => {
        expect(dir('packages')).to.exist;
        expect(file('lib/.eslintrc.js')).to.not.exist;
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
        expect(file('packages/.jshintrc')).to.not.exist;
      }));
  });
});
