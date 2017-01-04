'use strict';

const SilentError = require('silent-error');
const expect = require('chai').expect;

describe('SilentError', function() {
  it('return silent-error and print a deprecation', function() {
    const SilentErrorLib = require('../../../lib/errors/silent');
    expect(SilentErrorLib, 'returns silent-error').to.equal(SilentError);
  });
});
