'use strict';

let SilentError = require('silent-error');
let expect = require('chai').expect;

describe('SilentError', function() {
  it('return silent-error and print a deprecation', function() {
    let SilentErrorLib = require('../../../lib/errors/silent');
    expect(SilentErrorLib, 'returns silent-error').to.equal(SilentError);
  });
});
