/*jshint multistr: true */

'use strict';

var expect            = require('chai').expect;
var EOL               = require('os').EOL;
var SilentError       = require('silent-error');
var commandOptions    = require('../../factories/command-options');
var stub              = require('../../helpers/stub').stub;
var processHelpString = require('../../helpers/process-help-string');
var MockProject       = require('../../helpers/mock-project');
var Promise           = require('../../../lib/ext/promise');
var Task              = require('../../../lib/models/task');
var Blueprint         = require('../../../lib/models/blueprint');
var GenerateCommand   = require('../../../lib/commands/generate');

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

    //nodeModulesPath: 'somewhere/over/the/rainbow'
    command = new GenerateCommand(options);
  });

  afterEach(function() {
    if (Blueprint.list.restore) {
      Blueprint.list.restore();
    }
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
    expect(function() {
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

  describe('help', function() {
    it('lists available blueprints', function() {
      stub(Blueprint, 'list', [
        {
          source: 'my-app',
          blueprints: [
            {
              name: 'my-blueprint',
              availableOptions: [],
              anonymousOptions: []
            },
            {
              name: 'other-blueprint',
              availableOptions: [],
              anonymousOptions: []
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
      stub(Blueprint, 'list', [
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
      stub(Blueprint, 'list', [
        {
          source: 'my-app',
          blueprints: [
            {
              name: 'my-blueprint',
              availableOptions: [],
              anonymousOptions: []
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
      stub(Blueprint, 'list', [
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
      stub(Blueprint, 'list', [
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
      stub(Blueprint, 'list', [
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

    it('handles overridden blueprint', function() {
      stub(Blueprint, 'list', [
        {
          source: 'my-app',
          blueprints: [
            {
              name: 'my-blueprint',
              availableOptions: [],
              anonymousOptions: [],
              overridden: true
            }
          ]
        }
      ]);

      command.printDetailedHelp({
        rawArgs: ['my-blueprint'],
        verbose: true
      });

      var output = options.ui.output;

      var testString = processHelpString('\
      \u001b[90m(overridden)\u001b[39m \u001b[90mmy-blueprint\u001b[39m' + EOL + '\
' + EOL);

      expect(output).to.equal(testString);
    });

    it('handles all possible blueprint options', function() {
      stub(Blueprint, 'list', [
        {
          source: 'my-app',
          blueprints: [
            {
              name: 'my-blueprint',
              description: 'a paragraph',
              availableOptions: [
                {
                  name: 'test-option',
                  values: ['x', 'y'],
                  default: 'my-def-val',
                  required: true,
                  aliases: ['a', { b: 'c' }],
                  description: 'option desc'
                },
                {
                  name: 'test-type',
                  type: Boolean,
                  aliases: ['a']
                }
              ],
              anonymousOptions: ['anon-test'],
              printDetailedHelp: function() {
                return 'some details';
              }
            }
          ]
        }
      ]);

      command.printDetailedHelp({
        rawArgs: ['my-blueprint'],
        verbose: true
      });

      var output = options.ui.output;

      var testString = processHelpString('\
      my-blueprint \u001b[33m<anon-test>\u001b[39m \u001b[36m<options...>\u001b[39m' + EOL + '\
        \u001b[90ma paragraph\u001b[39m' + EOL + '\
        \u001b[36m--test-option\u001b[39m\u001b[36m=x|y\u001b[39m \u001b[36m(Default: my-def-val)\u001b[39m \u001b[36m(Required)\u001b[39m' + EOL + '\
          \u001b[90maliases: -a <value>, -b (--test-option=c)\u001b[39m option desc' + EOL + '\
        \u001b[36m--test-type\u001b[39m' + EOL + '\
          \u001b[90maliases: -a\u001b[39m' + EOL + '\
some details' + EOL + '\
' + EOL);

      expect(output).to.equal(testString);
    });

    it('handles the simplest blueprint option, to test else skipping', function() {
      stub(Blueprint, 'list', [
        {
          source: 'my-app',
          blueprints: [
            {
              name: 'my-blueprint',
              availableOptions: [
                {
                  name: 'test-option'
                }
              ],
              anonymousOptions: []
            }
          ]
        }
      ]);

      command.printDetailedHelp({
        rawArgs: ['my-blueprint'],
        verbose: true
      });

      var output = options.ui.output;

      var testString = processHelpString('\
      my-blueprint \u001b[36m<options...>\u001b[39m' + EOL + '\
        \u001b[36m--test-option\u001b[39m' + EOL + '\
' + EOL);

      expect(output).to.equal(testString);
    });
  });
});
