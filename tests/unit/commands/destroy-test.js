'use strict';

const expect = require('chai').expect;
const EOL = require('os').EOL;
const MockProject = require('../../helpers/mock-project');
const processHelpString = require('../../helpers/process-help-string');
const commandOptions = require('../../factories/command-options');
const Promise = require('rsvp').Promise;
const Task = require('../../../lib/models/task');
const DestroyCommand = require('../../../lib/commands/destroy');

describe('destroy command', function() {
  let options, command, project;

  beforeEach(function() {
    project = new MockProject();

    project.isEmberCLIProject = function() {
      return true;
    };

    options = commandOptions({
      project,
      tasks: {
        DestroyFromBlueprint: Task.extend({
          project,
          run(options) {
            return Promise.resolve(options);
          },
        }),
      },
    });

    command = new DestroyCommand(options);
  });

  it('runs DestroyFromBlueprint with expected options', function() {
    return command.validateAndRun(['controller', 'foo']).then(function(options) {
      expect(options.dryRun).to.be.false;
      expect(options.verbose).to.be.false;
      expect(options.args).to.deep.equal(['controller', 'foo']);
    });
  });

  it('complains if no entity name is given', function() {
    return expect(command.validateAndRun(['controller'])).to.be.rejected.then(error => {
      expect(error.message).to.equal(
        'The `ember destroy` command requires an ' +
          'entity name to be specified. ' +
          'For more details, use `ember help`.'
      );
    });
  });

  it('complains if no blueprint name is given', function() {
    return expect(command.validateAndRun([])).to.be.rejected.then(error => {
      expect(error.message).to.equal(
        'The `ember destroy` command requires a ' +
          'blueprint name to be specified. ' +
          'For more details, use `ember help`.'
      );
    });
  });

  it('does not throw errors when beforeRun is invoked without the blueprint name', function() {
    expect(() => {
      command.beforeRun([]);
    }).to.not.throw();
  });

  it('rethrows errors from beforeRun', function() {
    project.blueprintLookupPaths = undefined;

    expect(() => {
      command.beforeRun(['controller', 'foo']);
    }).to.throw(/(is not a function)|(has no method)/);
  });

  describe('help', function() {
    it('prints extra info', function() {
      command.printDetailedHelp();

      let output = options.ui.output;

      let testString = processHelpString(`${EOL}\
  Run \`ember help generate\` to view a list of available blueprints.${EOL}`);

      expect(output).to.equal(testString);
    });
  });
});
