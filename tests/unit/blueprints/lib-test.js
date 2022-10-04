'use strict';

const path = require('path');
const blueprintHelpers = require('ember-cli-blueprint-test-helpers/helpers');
let setupTestHooks = blueprintHelpers.setupTestHooks;
let emberNew = blueprintHelpers.emberNew;
let emberGenerate = blueprintHelpers.emberGenerate;

const expect = require('ember-cli-blueprint-test-helpers/chai').expect;
const dir = require('chai-files').dir;

describe('Acceptance: ember generate and destroy lib', function () {
  setupTestHooks(this, {
    cliPath: path.resolve(`${__dirname}/../../..`),
  });

  it('lib foo', async function () {
    let args = ['lib', 'foo'];

    await emberNew();
    await emberGenerate(args);

    expect(dir('lib')).to.exist;
  });
});
