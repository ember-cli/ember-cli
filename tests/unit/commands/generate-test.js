'use strict';

const expect = require('chai').expect;
const EOL = require('os').EOL;
const SilentError = require('silent-error');
const commandOptions = require('../../factories/command-options');
const processHelpString = require('../../helpers/process-help-string');
const MockProject = require('../../helpers/mock-project');
const Promise = require('../../../lib/ext/promise');
const Task = require('../../../lib/models/task');
const Blueprint = require('../../../lib/models/blueprint');
const GenerateCommand = require('../../../lib/commands/generate');
const td = require('testdouble');

describe('generate command', function() {
  let options, command;

  beforeEach(function() {
    let project = new MockProject();

    project.isEmberCLIProject = function() {
      return true;
    };

    project.blueprintLookupPaths = function() {
      return [];
    };

    options = commandOptions({
      project,

      tasks: {
        GenerateFromBlueprint: Task.extend({
          project,
          run(options) {
            return Promise.resolve(options);
          },
        }),
      },
    });

    command = new GenerateCommand(options);
  });

  afterEach(function() {
    td.reset();
  });

  it('runs GenerateFromBlueprint but with null nodeModulesPath', function() {
    command.project.hasDependencies = function() { return false; };

    return command.validateAndRun(['controller', 'foo']).then(function() {
      expect(true).to.be.false;
    }).catch(function(reason) {
      expect(reason.message).to.eql('node_modules appears empty, you may need to run `npm install`');
    });
  });

  it('runs GenerateFromBlueprint with expected options', function() {
    return command.validateAndRun(['controller', 'foo'])
      .then(function(options) {
        expect(options.pod).to.be.false;
        expect(options.dryRun).to.be.false;
        expect(options.verbose).to.be.false;
        expect(options.args).to.deep.equal(['controller', 'foo']);
      });
  });

  it('does not throw errors when beforeRun is invoked without the blueprint name', function() {
    expect(function() {
      command.beforeRun([]);
    }).to.not.throw();
  });

  it('complains if no blueprint name is given', function() {
    return command.validateAndRun([])
      .then(function() {
        expect(false, 'should not have called run').to.be.ok;
      })
      .catch(function(error) {
        expect(error.message).to.equal(
            'The `ember generate` command requires a ' +
            'blueprint name to be specified. ' +
            'For more details, use `ember help`.');
      });
  });

  describe('help', function() {
    beforeEach(function() {
      td.replace(Blueprint, 'list', td.function());
    });

    it('lists available blueprints', function() {
      td.when(Blueprint.list(), { ignoreExtraArgs: true }).thenReturn([
        {
          source: 'my-app',
          blueprints: [
            {
              name: 'my-blueprint',
              availableOptions: [],
              printBasicHelp() {
                return this.name;
              },
            },
            {
              name: 'other-blueprint',
              availableOptions: [],
              printBasicHelp() {
                return this.name;
              },
            },
          ],
        },
      ]);

      command.printDetailedHelp({});

      let output = options.ui.output;

      let testString = processHelpString(`${EOL}\
  Available blueprints:${EOL}\
    my-app:${EOL}\
my-blueprint${EOL}\
other-blueprint${EOL}\
${EOL}`);

      expect(output).to.equal(testString);
    });

    it('lists available blueprints json', function() {
      td.when(Blueprint.list(), { ignoreExtraArgs: true }).thenReturn([
        {
          source: 'my-app',
          blueprints: [
            {
              name: 'my-blueprint',
              availableOptions: [],
              getJson() {
                return {
                  name: this.name,
                };
              },
            },
            {
              name: 'other-blueprint',
              availableOptions: [],
              getJson() {
                return {
                  name: this.name,
                };
              },
            },
          ],
        },
      ]);

      let json = {};

      command.addAdditionalJsonForHelp(json, {
        json: true,
      });

      expect(json.availableBlueprints).to.deep.equal([
        {
          'my-app': [
            {
              name: 'my-blueprint',
            },
            {
              name: 'other-blueprint',
            },
          ],
        },
      ]);
    });

    it('works with single blueprint', function() {
      td.when(Blueprint.list(), { ignoreExtraArgs: true }).thenReturn([
        {
          source: 'my-app',
          blueprints: [
            {
              name: 'my-blueprint',
              availableOptions: [],
              printBasicHelp() {
                return this.name;
              },
            },
            {
              name: 'skipped-blueprint',
            },
          ],
        },
      ]);

      command.printDetailedHelp({
        rawArgs: ['my-blueprint'],
      });

      let output = options.ui.output;

      let testString = processHelpString(`\
my-blueprint${EOL}\
${EOL}`);

      expect(output).to.equal(testString);
    });

    it('works with single blueprint json', function() {
      td.when(Blueprint.list(), { ignoreExtraArgs: true }).thenReturn([
        {
          source: 'my-app',
          blueprints: [
            {
              name: 'my-blueprint',
              availableOptions: [],
              getJson() {
                return {
                  name: this.name,
                };
              },
            },
            {
              name: 'skipped-blueprint',
            },
          ],
        },
      ]);

      let json = {};

      command.addAdditionalJsonForHelp(json, {
        rawArgs: ['my-blueprint'],
        json: true,
      });

      expect(json.availableBlueprints).to.deep.equal([
        {
          'my-app': [
            {
              name: 'my-blueprint',
            },
          ],
        },
      ]);
    });

    it('handles missing blueprint', function() {
      td.when(Blueprint.list(), { ignoreExtraArgs: true }).thenReturn([
        {
          source: 'my-app',
          blueprints: [
            {
              name: 'my-blueprint',
            },
          ],
        },
      ]);

      command.printDetailedHelp({
        rawArgs: ['missing-blueprint'],
      });

      let output = options.ui.output;

      let testString = processHelpString(`\
\u001b[33mThe 'missing-blueprint' blueprint does not exist in this project.\u001b[39m${EOL}\
${EOL}`);

      expect(output).to.equal(testString);
    });

    it('handles missing blueprint json', function() {
      td.when(Blueprint.list(), { ignoreExtraArgs: true }).thenReturn([
        {
          source: 'my-app',
          blueprints: [
            {
              name: 'my-blueprint',
            },
          ],
        },
      ]);

      let json = {};

      command.addAdditionalJsonForHelp(json, {
        rawArgs: ['missing-blueprint'],
        json: true,
      });

      expect(json.availableBlueprints).to.deep.equal([
        {
          'my-app': [],
        },
      ]);
    });

    it('ignores overridden blueprints when verbose false', function() {
      td.when(Blueprint.list(), { ignoreExtraArgs: true }).thenReturn([
        {
          source: 'my-app',
          blueprints: [
            {
              name: 'my-blueprint',
              availableOptions: [],
              printBasicHelp() {
                return this.name;
              },
              overridden: true,
            },
          ],
        },
      ]);

      command.printDetailedHelp({});

      let output = options.ui.output;

      let testString = processHelpString(`${EOL}\
  Available blueprints:${EOL}\
${EOL}`);

      expect(output).to.equal(testString);
    });

    it('shows overridden blueprints when verbose true', function() {
      td.when(Blueprint.list(), { ignoreExtraArgs: true }).thenReturn([
        {
          source: 'my-app',
          blueprints: [
            {
              name: 'my-blueprint',
              availableOptions: [],
              printBasicHelp() {
                return this.name;
              },
              overridden: true,
            },
          ],
        },
      ]);

      command.printDetailedHelp({
        verbose: true,
      });

      let output = options.ui.output;

      let testString = processHelpString(`${EOL}\
  Available blueprints:${EOL}\
    my-app:${EOL}\
my-blueprint${EOL}\
${EOL}`);

      expect(output).to.equal(testString);
    });
  });
});
