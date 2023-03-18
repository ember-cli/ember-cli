'use strict';

const path = require('path');
const { emberGenerate, emberNew, setupTestHooks } = require('ember-cli-blueprint-test-helpers/helpers');

const { expect } = require('chai');
const { file } = require('chai-files');

describe('Acceptance: ember generate and destroy server', function () {
  setupTestHooks(this, {
    cliPath: path.resolve(`${__dirname}/../../..`),
  });

  it('server', async function () {
    let args = ['server'];

    await emberNew();
    await emberGenerate(args);
    expect(file('server/index.js')).to.contain('module.exports = function(app) {');
    // TODO: assert that `morgan` and `glob` dependencies were installed
  });
});
