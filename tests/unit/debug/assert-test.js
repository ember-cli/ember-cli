'use strict';

const { expect } = require('chai');
const { assert } = require('../../../lib/debug');

describe('assert', function () {
  it('it throws when the description argument is missing', function () {
    expect(() => {
      assert();
    }).to.throw('When calling `assert`, you must provide a description as the first argument.');

    expect(() => {
      assert('');
    }).to.throw('When calling `assert`, you must provide a description as the first argument.');
  });

  it('it does nothing when the condition argument is truthy', function () {
    expect(() => {
      assert('description', 1);
    }).to.not.throw();

    expect(() => {
      assert('description', {});
    }).to.not.throw();

    expect(() => {
      assert('description', true);
    }).to.not.throw();
  });

  it('it throws when the condition argument is falsy', function () {
    expect(() => {
      assert('description');
    }).to.throw('ASSERTION FAILED: description');

    expect(() => {
      assert('description', null);
    }).to.throw('ASSERTION FAILED: description');

    expect(() => {
      assert('description', false);
    }).to.throw('ASSERTION FAILED: description');
  });
});
