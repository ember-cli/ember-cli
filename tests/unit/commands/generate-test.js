'use strict';

var expect            = require('chai').expect;
var EOL               = require('os').EOL;
var SilentError       = require('silent-error');
var commandOptions    = require('../../factories/command-options');
var processHelpString = require('../../helpers/process-help-string');
var MockProject       = require('../../helpers/mock-project');
var Promise           = require('../../../lib/ext/promise');
var Task              = require('../../../lib/models/task');
var Blueprint         = require('../../../lib/models/blueprint');
var GenerateCommand   = require('../../../lib/commands/generate');
var td = require('testdouble');

describe('generate command', function() {
  var options, command;

  beforeEach(function() {
    var project = new MockProject();

    project.isEmberCLIProject = function() {
      return true;
    };

    project.blueprintLookupPaths = function() {
      return [];
    };

    options = commandOptions({
      project: project,

      tasks: {
        GenerateFromBlueprint: Task.extend({
          project: project,
          run: function(options) {
            return Promise.resolve(options);
          }
        })
      }
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
    })
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
      td.when(Blueprint.list(), {ignoreExtraArgs: true}).thenReturn([
        {
          source: 'my-app',
          blueprints: [
            {
              name: 'my-blueprint',
              availableOptions: [],
              printBasicHelp: function() {
                return this.name;
              }
            },
            {
              name: 'other-blueprint',
              availableOptions: [],
              printBasicHelp: function() {
                return this.name;
              }
            }
          ]
        }
      ]);

      command.printDetailedHelp({});

      var output = options.ui.output;

      var testString = processHelpString(EOL + '\
  Available blueprints:' + EOL + '\
    my-app:' + EOL + '\
my-blueprint' + EOL + '\
other-blueprint' + EOL + '\
' + EOL);

      expect(output).to.equal(testString);
    });

    it('lists available blueprints json', function() {
      td.when(Blueprint.list(), {ignoreExtraArgs: true}).thenReturn([
        {
          source: 'my-app',
          blueprints: [
            {
              name: 'my-blueprint',
              availableOptions: [],
              getJson: function() {
                return {
                  name: this.name
                };
              }
            },
            {
              name: 'other-blueprint',
              availableOptions: [],
              getJson: function() {
                return {
                  name: this.name
                };
              }
            }
          ]
        }
      ]);

      var json = {};

      command.addAdditionalJsonForHelp(json, {
        json: true
      });

      expect(json.availableBlueprints).to.deep.equal([
        {
          'my-app': [
            {
              name: 'my-blueprint',
            },
            {
              name: 'other-blueprint',
            }
          ]
        }
      ]);
    });

    it('works with single blueprint', function() {
      td.when(Blueprint.list(), {ignoreExtraArgs: true}).thenReturn([
        {
          source: 'my-app',
          blueprints: [
            {
              name: 'my-blueprint',
              availableOptions: [],
              printBasicHelp: function() {
                return this.name;
              }
            },
            {
              name: 'skipped-blueprint'
            }
          ]
        }
      ]);

      command.printDetailedHelp({
        rawArgs: ['my-blueprint']
      });

      var output = options.ui.output;

      var testString = processHelpString('\
my-blueprint' + EOL + '\
' + EOL);

      expect(output).to.equal(testString);
    });

    it('works with single blueprint json', function() {
      td.when(Blueprint.list(), {ignoreExtraArgs: true}).thenReturn([
        {
          source: 'my-app',
          blueprints: [
            {
              name: 'my-blueprint',
              availableOptions: [],
              getJson: function() {
                return {
                  name: this.name
                };
              }
            },
            {
              name: 'skipped-blueprint'
            }
          ]
        }
      ]);

      var json = {};

      command.addAdditionalJsonForHelp(json, {
        rawArgs: ['my-blueprint'],
        json: true
      });

      expect(json.availableBlueprints).to.deep.equal([
        {
          'my-app': [
            {
              name: 'my-blueprint',
            }
          ]
        }
      ]);
    });

    it('handles missing blueprint', function() {
      td.when(Blueprint.list(), {ignoreExtraArgs: true}).thenReturn([
        {
          source: 'my-app',
          blueprints: [
            {
              name: 'my-blueprint'
            }
          ]
        }
      ]);

      command.printDetailedHelp({
        rawArgs: ['missing-blueprint']
      });

      var output = options.ui.output;

      var testString = processHelpString('\
\u001b[33mThe \'missing-blueprint\' blueprint does not exist in this project.\u001b[39m' + EOL + '\
' + EOL);

      expect(output).to.equal(testString);
    });

    it('handles missing blueprint json', function() {
      td.when(Blueprint.list(), {ignoreExtraArgs: true}).thenReturn([
        {
          source: 'my-app',
          blueprints: [
            {
              name: 'my-blueprint'
            }
          ]
        }
      ]);

      var json = {};

      command.addAdditionalJsonForHelp(json, {
        rawArgs: ['missing-blueprint'],
        json: true
      });

      expect(json.availableBlueprints).to.deep.equal([
        {
          'my-app': []
        }
      ]);
    });

    it('ignores overridden blueprints when verbose false', function() {
      td.when(Blueprint.list(), {ignoreExtraArgs: true}).thenReturn([
        {
          source: 'my-app',
          blueprints: [
            {
              name: 'my-blueprint',
              availableOptions: [],
              printBasicHelp: function() {
                return this.name;
              },
              overridden: true
            }
          ]
        }
      ]);

      command.printDetailedHelp({});

      var output = options.ui.output;

      var testString = processHelpString(EOL + '\
  Available blueprints:' + EOL + '\
' + EOL);

      expect(output).to.equal(testString);
    });

    it('shows overridden blueprints when verbose true', function() {
      td.when(Blueprint.list(), {ignoreExtraArgs: true}).thenReturn([
        {
          source: 'my-app',
          blueprints: [
            {
              name: 'my-blueprint',
              availableOptions: [],
              printBasicHelp: function() {
                return this.name;
              },
              overridden: true
            }
          ]
        }
      ]);

      command.printDetailedHelp({
        verbose: true
      });

      var output = options.ui.output;

      var testString = processHelpString(EOL + '\
  Available blueprints:' + EOL + '\
    my-app:' + EOL + '\
my-blueprint' + EOL + '\
' + EOL);

      expect(output).to.equal(testString);
    });
  });
});
