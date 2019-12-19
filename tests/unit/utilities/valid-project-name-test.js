'use strict';

const isValidProjectName = require('../../../lib/utilities/valid-project-name');
const expect = require('chai').expect;

describe('lib/utilities/valid-project-name', function() {
  describe('isValidProjectName', function() {
    [
      'app',
      'addon',
      'public',
      '.',
      'ember',
      'so-cool.',
      'vendor',
      'test',
      '1234test',
      'application',
      '@foo/bar/baz',
    ].forEach(name => {
      it(`'${name}' is an invalid name`, function() {
        expect(isValidProjectName(name)).to.not.be.ok;
      });
    });

    ['my-app', 'foobar', 'testbaz', '@foo/bar'].forEach(name => {
      it(`'${name}' is a valid name`, function() {
        expect(isValidProjectName(name)).to.be.ok;
      });
    });
  });
});
