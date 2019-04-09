'use strict';

const Promise = require('../../../lib/utilities/promise');
const expect = require('chai').expect;
const semver = require('semver');

const isNode8 = semver.satisfies(process.version, '^8');

(isNode8 ? describe : describe.skip)('Promise', function() {
  it('should shim Promise.prototype.finally', function(done) {
    let fulfillmentValue = 1;
    let promise = Promise.resolve(fulfillmentValue);

    promise.finally(function() {
      expect(arguments.length).to.equal(0);
      done();
    });
  });
});
