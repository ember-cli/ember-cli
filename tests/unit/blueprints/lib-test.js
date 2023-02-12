'use strict';

const path = require('path');
const { emberGenerate, emberNew, setupTestHooks } = require('ember-cli-blueprint-test-helpers/helpers');

const { expect } = require('chai');
const { dir } = require('chai-files');

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
