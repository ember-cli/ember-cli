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

  it('packages foo', async function() {
    let args = ['packages', 'foo'];

    await emberNew();
    await emberGenerateDestroy(args, file => {
      expect(dir('packages')).to.exist;
      expect(file('lib/.eslintrc.js')).to.not.exist;
      expect(file('packages/.jshintrc')).to.not.exist;
    });
  });

  it('packages foo with ember-cli-jshint', async function() {
    let args = ['packages', 'foo'];

    await emberNew();
    await modifyPackages([{ name: 'ember-cli-jshint', dev: true }]);
    emberGenerateDestroy(args, file => {
      expect(dir('packages')).to.exist;
      expect(file('packages/.jshintrc')).to.not.exist;
    });
  });
});
