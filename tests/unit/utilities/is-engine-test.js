'use strict';

const expect = require('chai').expect;
const isEngine = require(`../../../lib/utilities/is-engine`);

describe('Unit | is-engine', function () {
  it('it identifies an engine correctly', function () {
    expect(isEngine([null, 'ember-engine', 'foo', 'bar'])).to.equal(true);
    expect(isEngine(['ember-engine'])).to.equal(true);
  });

  it("it returns false if it's not an engine", function () {
    expect(isEngine({ 'ember-engine': true })).to.equal(false);
    expect(isEngine('ember-engine')).to.equal(false);
    expect(isEngine(['foo', 'bar'])).to.equal(false);
    expect(isEngine({})).to.equal(false);
    expect(isEngine(undefined)).to.equal(false);
  });
});
