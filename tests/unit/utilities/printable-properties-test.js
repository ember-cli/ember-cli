'use strict';

var expect              = require('chai').expect;
var printableProperties = require('../../../lib/utilities/printable-properties');

describe('printable-properties', function() {
  describe('command', function() {
    var command = printableProperties.command;

    it('forEachWithProperty', function() {
      var obj = {
        name: 'kelly',
        description: 'this is a test',
        aliases: 'james bond',
        works: 'sometimes',
        availableOptions: 'some options',
        anonymousOptions: 'some other options',
        dontShowThis: true
      };

      var newObj = {};

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
    var blueprint = printableProperties.blueprint;

    it('forEachWithProperty', function() {
      var obj = {
        name: 'kelly',
        description: 'this is a test',
        availableOptions: 'some options',
        anonymousOptions: 'some other options',
        overridden: true,
        dontShowThis: true
      };

      var newObj = {};

      blueprint.forEachWithProperty(function(key) {
        newObj[key] = obj[key];
      }, obj);

      expect(newObj).to.deep.equal({
        name: 'kelly',
        description: 'this is a test',
        availableOptions: 'some options',
        anonymousOptions: 'some other options',
        overridden: true
      });
    });
  });
});
