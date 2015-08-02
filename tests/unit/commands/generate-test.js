'use strict';

var GenerateCommand = require('../../../lib/commands/generate');
var Promise         = require('../../../lib/ext/promise');
var Task            = require('../../../lib/models/task');
var expect          = require('chai').expect;
var commandOptions  = require('../../factories/command-options');
var SilentError     = require('silent-error');
var MockProject     = require('../../helpers/mock-project');

describe('generate command', function() {
  var command;

  beforeEach(function() {
    var project = new MockProject();
    project.name = function() {
      return 'some-random-name';
    };

    project.isEmberCLIProject = function isEmberCLIProject() {
      return true;
    };

    project.blueprintLookupPaths = function() {
      return [];
    };

    //nodeModulesPath: 'somewhere/over/the/rainbow'
    command = new GenerateCommand(commandOptions({
      settings: {},

      project: project,

      tasks: {
        GenerateFromBlueprint: Task.extend({
          project: project,
          run: function(options) {
            return Promise.resolve(options);
          }
        })
      }
    }));
  });

  it('runs GenerateFromBlueprint but with null nodeModulesPath', function() {
    command.project.hasDependencies = function() { return false; };

    expect(function() {
      command.validateAndRun(['controller', 'foo']);
    }).to.throw(SilentError, 'node_modules appears empty, you may need to run `npm install`');
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

  it('does not throws errors when beforeRun is invoked without the blueprint name', function() {
    expect(function () {
      command.beforeRun([]);
    }).to.not.throw();
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
