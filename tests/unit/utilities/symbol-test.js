'use strict';

const symbol = require('../../../lib/utilities/symbol');
const { expect } = require('chai');

describe('symbol', function() {
  it('expect format', function() {
    let foo = symbol('FOO');
    expect(foo).to.match(/__FOO__\s\[id=\w+\]/);
  });

  it('does not collide with another symbol of its own debug name', function() {
    expect(symbol('FOO')).to.not.eql(symbol('FOO'));
  });
});
