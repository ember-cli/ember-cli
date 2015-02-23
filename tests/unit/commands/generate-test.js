'use strict';

var GenerateCommand = require('../../../lib/commands/generate');
var Promise         = require('../../../lib/ext/promise');
var Task            = require('../../../lib/models/task');
var expect          = require('chai').expect;
var commandOptions  = require('../../factories/command-options');

describe('generate command', function() {
  var command;

  beforeEach(function() {
    command = new GenerateCommand(commandOptions({
      settings: {},

      project: {
        name: function() {
          return 'some-random-name';
        },

        isEmberCLIProject: function isEmberCLIProject() {
          return true;
        },
        blueprintLookupPaths: function() {
          return [];
        }
      },

      tasks: {
        GenerateFromBlueprint: Task.extend({
          run: function(options) {
            return Promise.resolve(options);
          }
        })
      }
    }));
  });

  it('runs GenerateFromBlueprint with expected options', function() {
    return command.validateAndRun(['controller', 'foo'])
      .then(function(options) {
        expect(options.pod, false);
        expect(options.dryRun, false);
        expect(options.verbose, false);
        expect(options.args).to.deep.equal(['controller', 'foo']);
      });
  });

  it('complains if no blueprint name is given', function() {
    return command.validateAndRun([])
      .then(function() {
        expect(false, 'should not have called run');
      })
      .catch(function(error) {
        expect(error.message).to.equal(
            'The `ember generate` command requires a ' +
            'blueprint name to be specified. ' +
            'For more details, use `ember help`.');
      });
  });

  it('complains if --help is called for non-existent blueprint.', function() {
    return Promise.resolve(command.printDetailedHelp({rawArgs:['foo','-h']}))
      .then(function() {
        expect(command.ui.output).to.include(
            'The \'foo\' blueprint does not exist in this project.');
      });
  });
});
