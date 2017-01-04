'use strict';

var SilentError = require('silent-error');
var expect = require('chai').expect;

describe('SilentError', function() {
  it('return silent-error and print a deprecation', function() {
    var SilentErrorLib = require('../../../lib/errors/silent');
    expect(SilentErrorLib, 'returns silent-error').to.equal(SilentError);
  });
});
