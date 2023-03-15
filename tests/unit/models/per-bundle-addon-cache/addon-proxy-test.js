'use strict';

const { expect } = require('chai');

const { getAddonProxy } = require('../../../../lib/models/per-bundle-addon-cache/addon-proxy');
const { TARGET_INSTANCE } = require('../../../../lib/models/per-bundle-addon-cache/target-instance');

describe('Unit | addon-proxy-test', function () {
  it('it allows a patched `preprocessJs` and is never set on the original addon instance', function () {
    const realAddon = {
      addons: ['foo'],
      preprocessJs() {},
    };

    const proxy1 = getAddonProxy({ [TARGET_INSTANCE]: realAddon }, {});
    const proxy2 = getAddonProxy({ [TARGET_INSTANCE]: realAddon }, {});

    const originalPreprocessJs1 = proxy1.preprocessJs;
    const originalPreprocessJs2 = proxy2.preprocessJs;

    proxy1.preprocessJs = () => {};

    expect(proxy1[TARGET_INSTANCE].preprocessJs).to.equal(
      realAddon.preprocessJs,
      "original addon's `preprocessJs` has not been modified"
    );

    proxy2.preprocessJs = () => {};

    expect(proxy2[TARGET_INSTANCE].preprocessJs).to.equal(
      realAddon.preprocessJs,
      "original addon's `preprocessJs` has not been modified"
    );

    proxy1.preprocessJs();

    // restore original
    proxy1.preprocessJs = originalPreprocessJs1;

    proxy2.preprocessJs();

    // restore original
    proxy2.preprocessJs = originalPreprocessJs2;

    proxy1.preprocessJs();
    proxy2.preprocessJs();
  });
});
