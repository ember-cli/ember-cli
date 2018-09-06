'use strict';

const validProjectName = require('../../../lib/utilities/valid-project-name');
const expect = require('chai').expect;

describe('validate project name', function() {
  ['app', 'public', '.', 'ember', 'so-cool.', 'vendor', 'test', '1234test'].forEach(name => {
    it(`'${name}' is an invalid name`, function() {
      expect(validProjectName(name)).to.not.be.ok;
    });
  });

  ['my-app', 'foobar', 'testbaz'].forEach(name => {
    it(`'${name}' is a valid name`, function() {
      expect(validProjectName(name)).to.be.ok;
    });
  });
});
