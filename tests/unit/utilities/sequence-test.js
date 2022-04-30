'use strict';

const { expect } = require('chai');
const sequence = require('../../../lib/utilities/sequence');

describe('sequence', function () {
  it('it works', async function () {
    let results = await sequence([
      () => Promise.resolve(1),
      2,
      () => new Promise((resolve) => setTimeout(() => resolve(3), 1000)),
    ]);

    expect(results).to.deep.equal([1, 2, 3]);
  });
});
