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
    it('prints all blueprints', function() {
      command.printDetailedHelp({});

      var output = options.ui.output;

      var testString = processHelpString(EOL + '\
  Available blueprints:' + EOL + '\
    ember-cli:' + EOL + '\
      acceptance-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates an acceptance test for a feature.\u001b[39m' + EOL + '\
      adapter \u001b[33m<name>\u001b[39m \u001b[36m<options...>\u001b[39m' + EOL + '\
        \u001b[90mGenerates an ember-data adapter.\u001b[39m' + EOL + '\
        \u001b[36m--base-class\u001b[39m' + EOL + '\
      adapter-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates an ember-data adapter unit test\u001b[39m' + EOL + '\
      addon \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mThe default blueprint for ember-cli addons.\u001b[39m' + EOL + '\
      addon-import \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates an import wrapper.\u001b[39m' + EOL + '\
      app \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mThe default blueprint for ember-cli projects.\u001b[39m' + EOL + '\
      blueprint \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a blueprint and definition.\u001b[39m' + EOL + '\
      component \u001b[33m<name>\u001b[39m \u001b[36m<options...>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a component. Name must contain a hyphen.\u001b[39m' + EOL + '\
        \u001b[36m--path\u001b[39m \u001b[36m(Default: components)\u001b[39m' + EOL + '\
          \u001b[90maliases: -no-path (--path=)\u001b[39m' + EOL + '\
      component-addon \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a component. Name must contain a hyphen.\u001b[39m' + EOL + '\
      component-test \u001b[33m<name>\u001b[39m \u001b[36m<options...>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a component integration or unit test.\u001b[39m' + EOL + '\
        \u001b[36m--test-type\u001b[39m \u001b[36m(Default: integration)\u001b[39m' + EOL + '\
          \u001b[90maliases: -i (--test-type=integration), -u (--test-type=unit), -integration (--test-type=integration), -unit (--test-type=unit)\u001b[39m' + EOL + '\
      controller \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a controller.\u001b[39m' + EOL + '\
      controller-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a controller unit test.\u001b[39m' + EOL + '\
      helper \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a helper function.\u001b[39m' + EOL + '\
      helper-addon \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates an import wrapper.\u001b[39m' + EOL + '\
      helper-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a helper unit test.\u001b[39m' + EOL + '\
      http-mock \u001b[33m<endpoint-path>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a mock api endpoint in /api prefix.\u001b[39m' + EOL + '\
      http-proxy \u001b[33m<local-path>\u001b[39m \u001b[33m<remote-url>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a relative proxy to another server.\u001b[39m' + EOL + '\
      in-repo-addon \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mThe blueprint for addon in repo ember-cli addons.\u001b[39m' + EOL + '\
      initializer \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates an initializer.\u001b[39m' + EOL + '\
      initializer-addon \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates an import wrapper.\u001b[39m' + EOL + '\
      initializer-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates an initializer unit test.\u001b[39m' + EOL + '\
      lib \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a lib directory for in-repo addons.\u001b[39m' + EOL + '\
      mixin \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a mixin.\u001b[39m' + EOL + '\
      mixin-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a mixin unit test.\u001b[39m' + EOL + '\
      model \u001b[33m<name>\u001b[39m \u001b[33m<attr:type>\u001b[39m' + EOL + '\
        \u001b[90mGenerates an ember-data model.\u001b[39m' + EOL + '\
      model-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a model unit test.\u001b[39m' + EOL + '\
      resource \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a model and route.\u001b[39m' + EOL + '\
      route \u001b[33m<name>\u001b[39m \u001b[36m<options...>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a route and a template, and registers the route with the router.\u001b[39m' + EOL + '\
        \u001b[36m--path\u001b[39m \u001b[36m(Default: )\u001b[39m' + EOL + '\
        \u001b[36m--skip-router\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
      route-addon \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates import wrappers for a route and its template.\u001b[39m' + EOL + '\
      route-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a route unit test.\u001b[39m' + EOL + '\
      serializer \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates an ember-data serializer.\u001b[39m' + EOL + '\
      serializer-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a serializer unit test.\u001b[39m' + EOL + '\
      server \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a server directory for mocks and proxies.\u001b[39m' + EOL + '\
      service \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a service.\u001b[39m' + EOL + '\
      service-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a service unit test.\u001b[39m' + EOL + '\
      template \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a template.\u001b[39m' + EOL + '\
      test-helper \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a test helper.\u001b[39m' + EOL + '\
      transform \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates an ember-data value transform.\u001b[39m' + EOL + '\
      transform-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a transform unit test.\u001b[39m' + EOL + '\
      util \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a simple utility module/function.\u001b[39m' + EOL + '\
      util-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a util unit test.\u001b[39m' + EOL + '\
      view \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a view subclass.\u001b[39m' + EOL + '\
      view-test \u001b[33m<name>\u001b[39m' + EOL + '\
        \u001b[90mGenerates a view unit test.\u001b[39m' + EOL + '\
' + EOL);

      expect(output).to.equal(testString);
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
some details' + EOL + '\
' + EOL);

      expect(output).to.equal(testString);
    });
  });
});
