'use strict';

var expect            = require('chai').expect;
var EOL               = require('os').EOL;
var MockProject       = require('../../helpers/mock-project');
var processHelpString = require('../../helpers/process-help-string');
var commandOptions    = require('../../factories/command-options');
var Promise           = require('../../../lib/ext/promise');
var Task              = require('../../../lib/models/task');
var DestroyCommand    = require('../../../lib/commands/destroy');

describe('destroy command', function() {
  var options, command;

  beforeEach(function() {
    var project = new MockProject();

    project.isEmberCLIProject = function() {
      return true;
    };

    options = commandOptions({
      project: project,
      tasks: {
        DestroyFromBlueprint: Task.extend({
          project: project,
          run: function(options) {
            return Promise.resolve(options);
          }
        })
      }
    });

    command = new DestroyCommand(options);
  });

  it('runs DestroyFromBlueprint with expected options', function() {
    return command.validateAndRun(['controller', 'foo'])
      .then(function(options) {
        expect(options.dryRun).to.be.false;
        expect(options.verbose).to.be.false;
        expect(options.args).to.deep.equal(['controller', 'foo']);
      });
  });

  it('complains if no entity name is given', function() {
    return command.validateAndRun(['controller'])
      .then(function() {
        expect(false, 'should not have called run').to.be.ok;
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
        expect(false, 'should not have called run').to.be.ok;
      })
      .catch(function(error) {
        expect(error.message).to.equal(
            'The `ember destroy` command requires a ' +
            'blueprint name to be specified. ' +
            'For more details, use `ember help`.');
      });
  });

  it('does not throws errors when beforeRun is invoked without the blueprint name', function() {
    expect(function() {
      command.beforeRun([]);
    }).to.not.throw();
  });

  it('rethrows errors from beforeRun', function() {
    expect(function() {
      command.beforeRun(['controller', 'foo']);
    }).to.throw(/(is not a function)|(has no method)/);
  });

  describe('help', function() {
    it('prints extra info', function() {
      command.printDetailedHelp();

      var output = options.ui.output;

      var testString = processHelpString(EOL + '\
  Run `ember help generate` to view a list of available blueprints.' + EOL);

      expect(output).to.equal(testString);
    });
  });
});
