'use strict';

const { expect } = require('chai');
const sequence = require('@ember-tooling/blueprint-model/utilities/sequence');

describe('sequence', function () {
  it('it works', async function () {
    let results = await sequence([
      Promise.resolve(1),
      () => Promise.resolve(2),
      3,
      () => new Promise((resolve) => setTimeout(() => resolve(4), 100)),
      (prevResult) => prevResult + 1,
    ]);

    expect(results).to.deep.equal([1, 2, 3, 4, 5]);
  });
});
