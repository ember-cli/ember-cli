'use strict';

const { resolve } = require('node:path');
const { execa } = require('execa');
const { expect } = require('chai');

const scriptPath = resolve(__dirname, '../../fixtures/deprecate-override/index.mjs');

describe('deprecate-override-remove', function () {
  it('does not error by default', async function () {
    const result = await execa('node', [scriptPath]);
    expect(result.stdout).to.contain('success');
  });

  it('does error when we override the ember-cli version', async function () {
    let errorResult;

    try {
      await execa('node', [scriptPath], {
        env: {
          OVERRIDE_DEPRECATION_VERSION: '55.0.0',
        },
      });
    } catch (err) {
      errorResult = err;
    }

    expect(errorResult.stderr).to.contain(
      'Error: The API deprecated by deprecate-override-test was removed in ember-cli@15.0.0. The message was: you can do this for a while longer eh. Please see undefined for more details'
    );
  });
});
