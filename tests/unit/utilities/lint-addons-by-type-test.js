'use strict';

const td = require('testdouble');
const expect = require('chai').expect;
const lintAddonsByType = require('../../../lib/utilities/lint-addons-by-type');

describe('lintAddonsByType', function() {
  let addons;

  beforeEach(function() {
    addons = [
      {
        name: 'foo',
        pkg: { name: 'foo' },
        lintTree: td.function(),
      },
    ];
  });

  it('calls lintTree on the addon', function() {
    lintAddonsByType(addons, 'app', { foo: 'bar' });

    td.verify(addons[0].lintTree('app', { foo: 'bar' }));
  });

  it('filters out tree if `lintTree` returns false-y', function() {
    td.when(addons[0].lintTree).thenReturn({});

    expect(lintAddonsByType(addons, 'app')).to.deep.equal([]);
  });
});
