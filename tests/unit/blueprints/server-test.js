'use strict';

const path = require('path');
const blueprintHelpers = require('ember-cli-blueprint-test-helpers/helpers');
let setupTestHooks = blueprintHelpers.setupTestHooks;
let emberNew = blueprintHelpers.emberNew;
let emberGenerate = blueprintHelpers.emberGenerate;
let modifyPackages = blueprintHelpers.modifyPackages;

const chai = require('ember-cli-blueprint-test-helpers/chai');
let expect = chai.expect;
let file = chai.file;

describe('Acceptance: ember generate and destroy server', function() {
  setupTestHooks(this, {
    cliPath: path.resolve(`${__dirname}/../../..`),
  });

  it('server', async function() {
    let args = ['server'];

    await emberNew();
    await emberGenerate(args);
    expect(file('server/index.js')).to.contain('module.exports = function(app) {');
    expect(file('server/.jshintrc')).to.not.exist;
    // TODO: assert that `morgan` and `glob` dependencies were installed
  });

  it('server with ember-cli-jshint', async function() {
    let args = ['server'];

    await emberNew();
    await modifyPackages([{ name: 'ember-cli-jshint', dev: true }]);
    await emberGenerate(args);
    expect(file('server/.jshintrc')).to.exist;
  });
});
