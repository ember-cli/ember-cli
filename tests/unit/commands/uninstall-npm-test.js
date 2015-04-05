'use strict';

var expect           = require('chai').expect;
var commandOptions   = require('../../factories/command-options');
var UninstallCommand = require('../../../lib/commands/uninstall-npm');

describe('uninstall:npm command', function() {
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
      }
    });

    command  = new UninstallCommand(options);
    msg      = 'This command has been deprecated. Please use `npm uninstall ';
    msg     += '<packageName> --save-dev` instead.';
  });

  describe('with no args', function() {
    it('throws a friendly silent error', function() {
      return command.validateAndRun([]).then(function() {
        expect(false, 'should reject with error');
      }).catch(function(err) {
        expect(err.message).to.equal(
          msg, 'expect error to have a helpful message'
        );
      });
    });
  });

  describe('with args', function() {
    it('throws a friendly silent error', function() {
      return command.validateAndRun(['moment', 'lodash']).then(function() {
        expect(false, 'should reject with error');
      }).catch(function(err) {
        expect(err.message).to.equal(
          msg, 'expect error to have a helpful message'
        );
      });
    });
  });
});
