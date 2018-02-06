'use strict';

const expect = require('chai').expect;

const emberAppUtils = require('../../../lib/utilities/ember-app-utils');

const normalizeUrl = emberAppUtils.normalizeUrl;
const calculateBaseTag = emberAppUtils.calculateBaseTag;
const convertObjectToString = emberAppUtils.convertObjectToString;

describe('ember-app-utils', function() {
  describe(`calculateBaseTag`, function() {
    ['auto', 'history'].forEach(locationType => {
      it(`generates a base tag correctly for location: ${locationType}`, function() {
        expect(
          calculateBaseTag('/', locationType),
          `base tag was generated correctly`
        ).to.equal('<base href="/" />');
      });
    });

    it('returns an empty string if location is "hash"', function() {
      expect(
        calculateBaseTag('/', 'hash'),
        `base tag was generated correctly`
      ).to.equal('');
    });

    [null, undefined, ''].forEach(url => {
      it(`returns an empty string if the url is ${url === '' ? 'empty string' : url}`, function() {
        expect(calculateBaseTag(url, 'hash')).to.equal('');
      });
    });
  });

  describe(`convertObjectToString`, function() {
    it('transforms config object into a string', function() {
      expect(
        convertObjectToString({ foobar: 'baz' }),
        `config was transformed correctly`
      ).to.equal('{"foobar":"baz"}');
    });

    it('returns empty object string for "falsy" values', function() {
      let invalidValues = [null, undefined, 0];

      invalidValues.forEach(value => {
        expect(
          convertObjectToString(value),
          `${value} was transformed correctly`
        ).to.equal('{}');
      });
    });
  });

  describe(`normalizeUrl`, function() {
    it('transforms input values to valid urls', function() {
      expect(
        normalizeUrl('local/people'),
        '`local/people` was transformed correctly'
      ).to.equal('/local/people/');

      expect(
        normalizeUrl('people'),
        '`people` was transformed correctly'
      ).to.equal('/people/');

      expect(
        normalizeUrl('/people'),
        '`/people` was transformed correctly'
      ).to.equal('/people/');

      expect(
        normalizeUrl('/'),
        '`/` is transformed correctly'
      ).to.equal('/');
    });

    it('returns an empty string for `null`, `undefined` and empty string', function() {
      let invalidUrls = [null, undefined, ''];

      invalidUrls.forEach(url => {
        expect(
          normalizeUrl(url),
          `${url} was transformed correctly`
        ).to.equal('');
      });
    });
  });
});
