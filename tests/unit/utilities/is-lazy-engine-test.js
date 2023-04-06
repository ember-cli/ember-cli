'use strict';

const { expect } = require('chai');
const isLazyEngine = require(`../../../lib/utilities/is-lazy-engine`);

describe('Unit | is-lazy-engine', function () {
  it('it identifies a lazy engine correctly', function () {
    expect(isLazyEngine({ options: { lazyLoading: { enabled: true } } })).to.equal(true);
  });

  it("it returns false if it's not a lazy engine", function () {
    expect(isLazyEngine({ options: { lazyLoading: { enabled: false } } })).to.equal(false);
    expect(isLazyEngine({ options: { lazyLoading: {} } })).to.equal(false);
    expect(isLazyEngine({ options: {} })).equal(false);
    expect(isLazyEngine({})).to.equal(false);
    expect(isLazyEngine()).to.equal(false);
  });
});
