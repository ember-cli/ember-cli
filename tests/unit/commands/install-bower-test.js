'use strict';

var expect         = require('chai').expect;
var commandOptions = require('../../factories/command-options');
var InstallCommand = require('../../../lib/commands/install-bower');
var MockProject    = require('../../helpers/mock-project');

describe('install:bower command', function() {
  var command, options, msg;

  beforeEach(function() {
    var project = new MockProject();
    project.name = function() {
      return 'some-random-name';
    };

    project.isEmberCLIProject = function() {
      return true;
    };

    options = commandOptions({
      settings: {},
      project: project
    });

    command  = new InstallCommand(options);
    msg      = 'This command has been removed. Please use `bower install ';
    msg     += '<packageName> --save-dev --save-exact` instead.';
    msg     += 'Add `--offline` to make bower use only locally cached packages.';
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
