'use strict';

var DestroyCommand  = require('../../../lib/commands/destroy');
var Promise         = require('../../../lib/ext/promise');
var Task            = require('../../../lib/models/task');
var expect          = require('chai').expect;
var commandOptions  = require('../../factories/command-options');

describe('generate command', function() {
  var command;

  beforeEach(function() {
    command = new DestroyCommand(commandOptions({
      settings: {},

      project:   {
        name: function() {
          return 'some-random-name';
        },

        isEmberCLIProject: function isEmberCLIProject() {
          return true;
        }
      },

      tasks: {
        DestroyFromBlueprint: Task.extend({
          run: function(options) {
            return Promise.resolve(options);
          }
        })
      }
    }));
  });

  it('runs DestroyFromBlueprint with expected options', function() {
    return command.validateAndRun(['controller', 'foo'])
      .then(function(options) {
        expect(options.dryRun, false);
        expect(options.verbose, false);
        expect(options.args).to.deep.equal(['controller', 'foo']);
      });
  });

  it('complains if no entity name is given', function() {
    return command.validateAndRun(['controller'])
      .then(function() {
        expect(false, 'should not have called run');
      })
      .catch(function(error) {
        expect(error.message).to.equal(
            'The `ember destroy` command requires an ' +
            'entity name to be specified. ' +
            'For more details, use `ember help`.');
      });
  });

  it('complains if no blueprint name is given', function() {
    return command.validateAndRun([])
      .then(function() {
        expect(false, 'should not have called run');
      })
      .catch(function(error) {
        expect(error.message).to.equal(
            'The `ember destroy` command requires a ' +
            'blueprint name to be specified. ' +
            'For more details, use `ember help`.');
      });
  });
  
  it('rethrows errors from beforeRun', function() {
    return Promise.resolve(function(){ return command.beforeRun(['controller', 'foo']);})
    .then(function() {
      expect(false, 'should not have called run');
    })
    .catch(function(error) {
      expect(error.message).to.equal('undefined is not a function');
    });
  });
});
