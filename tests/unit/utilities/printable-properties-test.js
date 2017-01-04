'use strict';

const expect = require('chai').expect;
const printableProperties = require('../../../lib/utilities/printable-properties');

describe('printable-properties', function() {
  describe('command', function() {
    let command = printableProperties.command;

    it('forEachWithProperty', function() {
      let obj = {
        name: 'kelly',
        description: 'this is a test',
        aliases: 'james bond',
        works: 'sometimes',
        availableOptions: 'some options',
        anonymousOptions: 'some other options',
        dontShowThis: true,
      };

      let newObj = {};

      command.forEachWithProperty(function(key) {
        newObj[key] = obj[key];
      }, obj);

      expect(newObj).to.deep.equal({
        name: 'kelly',
        description: 'this is a test',
        aliases: 'james bond',
        works: 'sometimes',
        availableOptions: 'some options',
        anonymousOptions: 'some other options',
      });
    });
  });

  describe('blueprint', function() {
    let blueprint = printableProperties.blueprint;

    it('forEachWithProperty', function() {
      let obj = {
        name: 'kelly',
        description: 'this is a test',
        availableOptions: 'some options',
        anonymousOptions: 'some other options',
        overridden: true,
        dontShowThis: true,
      };

      let newObj = {};

      blueprint.forEachWithProperty(function(key) {
        newObj[key] = obj[key];
      }, obj);

      expect(newObj).to.deep.equal({
        name: 'kelly',
        description: 'this is a test',
        availableOptions: 'some options',
        anonymousOptions: 'some other options',
        overridden: true,
      });
    });
  });
});
