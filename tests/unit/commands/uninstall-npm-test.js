'use strict';

var expect           = require('chai').expect;
var commandOptions   = require('../../factories/command-options');
var UninstallCommand = require('../../../lib/commands/uninstall-npm');
var MockProject      = require('../../helpers/mock-project');

describe('uninstall:npm command', function() {
  var command, options, msg;

  beforeEach(function() {
    var project = new MockProject();
    project.name = function() { return 'some-random-name'; };
    project.isEmberCLIProject = function() { return true; };

    options = commandOptions({
      settings: {},
      project: project
    });

    command  = new UninstallCommand(options);
    msg      = 'This command has been removed Please use `npm uninstall ';
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
