'use strict';

const { expect } = require('chai');
const { file } = require('chai-files');
const { emberGenerate, emberNew, setupTestHooks } = require('ember-cli-blueprint-test-helpers/helpers');
const path = require('path');

describe('Acceptance: ember generate and destroy vendor-shim', function () {
  setupTestHooks(this, {
    cliPath: path.resolve(`${__dirname}/../../..`),
  });

  it('it works', async function () {
    await emberNew();
    await emberGenerate(['vendor-shim', 'foo']);

    expect(file('vendor/shims/foo.js')).to.equal(`(function() {
  function vendorModule() {
    'use strict';

    return {
      'default': self['foo'],
      __esModule: true,
    };
  }

  define('foo', [], vendorModule);
})();
`);
  });
});
