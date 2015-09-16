/*jshint multistr: true */

'use strict';

var path          = require('path');
var tmp           = require('tmp-sync');
var expect        = require('chai').expect;
var EOL           = require('os').EOL;
var ember         = require('../../helpers/ember');
var convertToJson = require('../../helpers/convert-help-output-to-json');
var Promise       = require('../../../lib/ext/promise');
var remove        = Promise.denodeify(require('fs-extra').remove);
var root          = process.cwd();
var tmproot       = path.join(root, 'tmp');
var tmpdir;

describe('Acceptance: ember help --json generate', function() {
  beforeEach(function() {
    tmpdir = tmp.in(tmproot);
    process.chdir(tmpdir);
  });

  afterEach(function() {
    process.chdir(root);
    return remove(tmproot);
  });

  it('works', function() {
    return ember([
      'help',
      'generate',
      '--json'
    ])
    .then(function(result) {
      var json = convertToJson(result.ui.output);

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
            description: 'Dry run, simulate blueprint generation without affecting your project',
            aliases: ['d'],
            key: 'dryRun',
            required: false
          },
          {
            name: 'verbose',
            default: false,
            description: 'Verbose output',
            aliases: ['v'],
            key: 'verbose',
            required: false
          },
          {
            name: 'pod',
            default: false,
            description: 'Generate blueprint in pod structure',
            aliases: ['p'],
            key: 'pod',
            required: false
          },
          {
            name: 'classic',
            default: false,
            description: 'Generate blueprint in classic structure',
            aliases: ['c'],
            key: 'classic',
            required: false
          },
          {
            name: 'dummy',
            default: false,
            description: 'Generate blueprint in `tests/dummy` when inside an addon project',
            aliases: ['dum', 'id'],
            key: 'dummy',
            required: false
          },
          {
            name: 'in-repo-addon',
            default: null,
            description: 'Generate blueprint in specified in-repo-addon when inside a project',
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
    return ember([
      'help',
      'generate',
      '--json'
    ])
    .then(function(result) {
      var json = convertToJson(result.ui.output);

      var command = json.commands[0];
      expect(command.name).to.equal('generate');
    });
  });

  it('lists overridden blueprints', function() {
    return ember([
      'init',
      '--name=my-app',
      '--skip-npm',
      '--skip-bower'
    ])
    .then(function() {
      return ember([
        'generate',
        'blueprint',
        'component'
      ]);
    })
    .then(function() {
      return ember([
        'help',
        'generate',
        'component',
        '--verbose',
        '--json'
      ]);
    })
    .then(function(result) {
      var json = convertToJson(result.ui.output);

      var command = json.commands[0];
      expect(command.availableBlueprints).to.deep.equal([
        {
          'my-app': [
            {
              name: 'component',
              description: '',
              availableOptions: [],
              anonymousOptions: ['name'],
              overridden: false
            }
          ]
        },
        {
          'ember-cli': [
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
              overridden: true
            }
          ]
        }
      ]);
    });
  });

  it('handles missing blueprint', function() {
    return ember([
      'help',
      'generate',
      'asdf',
      '--json'
    ])
    .then(function(result) {
      var json = convertToJson(result.ui.output);

      var command = json.commands[0];
      expect(command.availableBlueprints).to.deep.equal([
        {
          'ember-cli': []
        }
      ]);
    });
  });

  it('works with single blueprint', function() {
    return ember([
      'help',
      'generate',
      'component',
      '--json'
    ])
    .then(function(result) {
      var json = convertToJson(result.ui.output);

      var command = json.commands[0];
      expect(command.availableBlueprints).to.deep.equal([
        {
          'ember-cli': [
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
            }
          ]
        }
      ]);
    });
  });

  it('handles extra help', function() {
    return ember([
      'help',
      'generate',
      'model',
      '--json'
    ])
    .then(function(result) {
      var json = convertToJson(result.ui.output);

      var command = json.commands[0];
      expect(command.availableBlueprints[0]['ember-cli'][0].detailedHelp).to.equal('\
<grey>You may generate models with as many attrs as you would like to pass. The following attribute types are supported:</grey>' + EOL + '\
  <yellow><attr-name></yellow>' + EOL + '\
  <yellow><attr-name></yellow>:array' + EOL + '\
  <yellow><attr-name></yellow>:boolean' + EOL + '\
  <yellow><attr-name></yellow>:date' + EOL + '\
  <yellow><attr-name></yellow>:object' + EOL + '\
  <yellow><attr-name></yellow>:number' + EOL + '\
  <yellow><attr-name></yellow>:string' + EOL + '\
  <yellow><attr-name></yellow>:your-custom-transform' + EOL + '\
  <yellow><attr-name></yellow>:belongs-to:<yellow><model-name></yellow>' + EOL + '\
  <yellow><attr-name></yellow>:has-many:<yellow><model-name></yellow>' + EOL + '\
' + EOL + '\
For instance: <green>\\`ember generate model taco filling:belongs-to:protein toppings:has-many:toppings name:string price:number misc\\`</green>' + EOL + '\
would result in the following model:' + EOL + '\
' + EOL + '\
```js' + EOL + '\
import DS from \'ember-data\';' + EOL + '\
export default DS.Model.extend({' + EOL + '\
  filling: DS.belongsTo(\'protein\'),' + EOL + '\
  toppings: DS.hasMany(\'topping\'),' + EOL + '\
  name: DS.attr(\'string\'),' + EOL + '\
  price: DS.attr(\'number\'),' + EOL + '\
  misc: DS.attr()' + EOL + '\
});' + EOL + '\
```' + EOL);
    });
  });
});
