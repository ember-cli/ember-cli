'use strict';

var expect         = require('chai').expect;
var commandOptions = require('../../factories/command-options');
var InstallCommand = require('../../../lib/commands/install-bower');

describe('install:bower command', function() {
  var command, options, msg;

  beforeEach(function() {
    options = commandOptions({
      settings: {},

      project: {
        name: function() {
          return 'some-random-name';
        },

        isEmberCLIProject: function() {
          return true;
        }
      },
    });

    command  = new InstallCommand(options);
    msg      = 'This command has been deprecated. Please use `bower install ';
    msg     += '<packageName> --save-dev --save-exact` instead.';
  });

  describe('with args', function() {
    it('it throws a friendly silent error', function() {
      return command.validateAndRun(['moment', 'lodash']).then(function() {
        expect(false, 'should reject with error');
      }).catch(function(err) {
        expect(err.message).to.equal(
          msg, 'expect error to have a helpful message'
        );
      });
    });
  });

  describe('without args', function() {
    it('it throws a friendly slient error', function() {
       return command.validateAndRun([]).then(function() {
        expect(false, 'should reject with error');
      }).catch(function(err) {
        expect(err.message).to.equal(
          msg, 'expect error to have a helpful message'
        );
      });
    });
  });
});
