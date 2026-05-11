'use strict';

const { resolve } = require('node:path');
const { execaNode } = require('execa');
const { expect } = require('chai');

const scriptPath = resolve(__dirname, '../../fixtures/deprecate-override/index.mjs');

describe('deprecate-override-remove', function () {
  it('does not error by default', async function () {
    // make sure we override env here so the CI job that runs the whole test suite with
    // OVERRIDE_DEPRECATION_VERSION doesn't mess with the test. We need to provide some sort of
    // env object plus the `extendEnv: false` for this to have the desired effect
    const result = await execaNode(scriptPath, { env: { something: 'anything' }, extendEnv: false });
    expect(result.stdout).to.contain('success');
  });

  it('does error when we override the ember-cli version', async function () {
    let errorResult;

    try {
      await execaNode(scriptPath, {
        env: {
          OVERRIDE_DEPRECATION_VERSION: '55.0.0',
        },
        extendEnv: false,
      });
    } catch (err) {
      errorResult = err;
    }

    expect(errorResult.stderr).to.contain(
      'Error: The API deprecated by deprecate-override-test was removed in ember-cli@15.0.0. The message was: you can do this for a while longer eh. Please see undefined for more details'
    );
  });
});
