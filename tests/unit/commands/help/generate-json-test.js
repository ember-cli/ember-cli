'use strict';

var expect        = require('chai').expect;
var proxyquire    = require('proxyquire');
var MockUI        = require('../../../helpers/mock-ui');
var MockAnalytics = require('../../../helpers/mock-analytics');
var convertToJson = require('../../../helpers/convert-help-output-to-json');
var Blueprint     = require('../../../../lib/models/blueprint');
var HelpCommand   = require('../../../../lib/commands/help');

var blueprintListStub;
var GenerateCommand = proxyquire('../../../../lib/commands/generate', {
  '../models/blueprint': {
    list: function() {
      return blueprintListStub.apply(this, arguments);
    }
  }
});

describe('help command: generate json', function() {
  var ui, command;

  beforeEach(function() {
    ui = new MockUI();

    var options = {
      ui: ui,
      analytics: new MockAnalytics(),
      commands: {
        'Generate': GenerateCommand
      },
      project: {
        isEmberCLIProject: function() {
          return true;
        },
        blueprintLookupPaths: function() {
          return [];
        }
      },
      settings: {}
    };

    command = new HelpCommand(options);

    blueprintListStub = Blueprint.list;
  });

  it('works', function() {
    return command.validateAndRun(['generate', '--json']).then(function() {
      var json = convertToJson(ui.output);

      var command = json.commands[0];
      expect(command).to.deep.equal({
        name: 'generate',
        description: 'Generates new code from blueprints.',
        aliases: ['g'],
        works: 'insideProject',
        availableOptions: [
          {
            name: 'dry-run',
            default: false,
            aliases: ['d'],
            key: 'dryRun',
            required: false
          },
          {
            name: 'verbose',
            default: false,
            aliases: ['v'],
            key: 'verbose',
            required: false
          },
          {
            name: 'pod',
            default: false,
            aliases: ['p'],
            key: 'pod',
            required: false
          },
          {
            name: 'classic',
            default: false,
            aliases: ['c'],
            key: 'classic',
            required: false
          },
          {
            name: 'dummy',
            default: false,
            aliases: ['dum', 'id'],
            key: 'dummy',
            required: false
          },
          {
            name: 'in-repo-addon',
            default: null,
            aliases: ['in-repo', 'ir'],
            key: 'inRepoAddon',
            required: false
          }
        ],
        anonymousOptions: ['<blueprint>'],
        availableBlueprints: [
          {
            'ember-cli': [
              {
                name: 'acceptance-test',
                description: 'Generates an acceptance test for a feature.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'adapter',
                description: 'Generates an ember-data adapter.',
                availableOptions: [
                  {
                    name: 'base-class',
                    key: 'baseClass',
                    required: false
                  }
                ],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'adapter-test',
                description: 'Generates an ember-data adapter unit test',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'addon',
                description: 'The default blueprint for ember-cli addons.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'addon-import',
                description: 'Generates an import wrapper.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'app',
                description: 'The default blueprint for ember-cli projects.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'blueprint',
                description: 'Generates a blueprint and definition.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'component',
                description: 'Generates a component. Name must contain a hyphen.',
                availableOptions: [
                  {
                    name: 'path',
                    default: 'components',
                    aliases: [
                      { 'no-path': '' }
                    ],
                    key: 'path',
                    required: false
                  }
                ],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'component-addon',
                description: 'Generates a component. Name must contain a hyphen.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'component-test',
                description: 'Generates a component integration or unit test.',
                availableOptions: [
                  {
                    name: 'test-type',
                    type: ['integration', 'unit'],
                    default: 'integration',
                    aliases: [
                      { i: 'integration' },
                      { u: 'unit' },
                      { integration: 'integration' },
                      { unit: 'unit' }
                    ],
                    key: 'testType',
                    required: false
                  }
                ],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'controller',
                description: 'Generates a controller.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'controller-test',
                description: 'Generates a controller unit test.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'helper',
                description: 'Generates a helper function.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'helper-addon',
                description: 'Generates an import wrapper.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'helper-test',
                description: 'Generates a helper unit test.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'http-mock',
                description: 'Generates a mock api endpoint in /api prefix.',
                availableOptions: [],
                anonymousOptions: ['endpoint-path'],
                overridden: false
              },
              {
                name: 'http-proxy',
                description: 'Generates a relative proxy to another server.',
                availableOptions: [],
                anonymousOptions: ['local-path', 'remote-url'],
                overridden: false
              },
              {
                name: 'in-repo-addon',
                description: 'The blueprint for addon in repo ember-cli addons.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'initializer',
                description: 'Generates an initializer.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'initializer-addon',
                description: 'Generates an import wrapper.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'initializer-test',
                description: 'Generates an initializer unit test.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'lib',
                description: 'Generates a lib directory for in-repo addons.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'mixin',
                description: 'Generates a mixin.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'mixin-test',
                description: 'Generates a mixin unit test.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'model',
                description: 'Generates an ember-data model.',
                availableOptions: [],
                anonymousOptions: ['name', 'attr:type'],
                overridden: false
              },
              {
                name: 'model-test',
                description: 'Generates a model unit test.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'resource',
                description: 'Generates a model and route.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'route',
                description: 'Generates a route and registers it with the router.',
                availableOptions: [
                  {
                    name: 'path',
                    default: '',
                    key: 'path',
                    required: false
                  },
                  {
                    name: 'skip-router',
                    default: false,
                    key: 'skipRouter',
                    required: false
                  }
                ],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'route-addon',
                description: 'Generates import wrappers for a route and its template.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'route-test',
                description: 'Generates a route unit test.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'serializer',
                description: 'Generates an ember-data serializer.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'serializer-test',
                description: 'Generates a serializer unit test.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'server',
                description: 'Generates a server directory for mocks and proxies.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'service',
                description: 'Generates a service.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'service-test',
                description: 'Generates a service unit test.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'template',
                description: 'Generates a template.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'test-helper',
                description: 'Generates a test helper.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'transform',
                description: 'Generates an ember-data value transform.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'transform-test',
                description: 'Generates a transform unit test.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'util',
                description: 'Generates a simple utility module/function.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'util-test',
                description: 'Generates a util unit test.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'view',
                description: 'Generates a view subclass.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              },
              {
                name: 'view-test',
                description: 'Generates a view unit test.',
                availableOptions: [],
                anonymousOptions: ['name'],
                overridden: false
              }
            ]
          }
        ]
      });
    });
  });

  it('works with alias g', function() {
    return command.validateAndRun(['g', '--json']).then(function() {
      var json = convertToJson(ui.output);

      var command = json.commands[0];
      expect(command.name).to.equal('generate');
    });
  });

  it('handles missing blueprint', function() {
    blueprintListStub = function() {
      return [
        {
          source: 'my-app',
          blueprints: [
            {
              name: 'my-blueprint'
            }
          ]
        }
      ];
    };

    var options = {
      ui: ui,
      analytics: new MockAnalytics(),
      project: {
        isEmberCLIProject: function() {
          return true;
        },
        blueprintLookupPaths: function() {
          return [];
        }
      },
      settings: {}
    };

    command = new GenerateCommand(options);

    options = {
      rawArgs: ['missing-blueprint'],
      json: true
    };

    var json = {};

    command.addAdditionalJsonForHelp(json, options);

    expect(json.availableBlueprints).to.deep.equal([
      {
        'my-app': []
      }
    ]);
  });

  it('works with single blueprint', function() {
    blueprintListStub = function() {
      return [
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
      ];
    };

    var options = {
      ui: ui,
      analytics: new MockAnalytics(),
      project: {
        isEmberCLIProject: function() {
          return true;
        },
        blueprintLookupPaths: function() {
          return [];
        }
      },
      settings: {}
    };

    command = new GenerateCommand(options);

    options = {
      rawArgs: ['my-blueprint'],
      json: true
    };

    var json = {};

    command.addAdditionalJsonForHelp(json, options);

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
});
