var processHelpString = require('../../helpers/process-help-string');
var versionUtils      = require('../../../lib/utilities/version-utils');
var emberCLIVersion   = versionUtils.emberCLIVersion;

module.exports = {
  name: 'ember',
  description: null,
  aliases: [],
  works: 'insideProject',
  availableOptions: [],
  anonymousOptions: ['<command (Default: help)>'],
  version: emberCLIVersion(),
  commands: [
    {
      name: 'addon',
      description: 'Generates a new folder structure for building an addon, complete with test harness.',
      aliases: [],
      works: 'outsideProject',
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
          name: 'blueprint',
          default: 'addon',
          aliases: ['b'],
          key: 'blueprint',
          required: false
        },
        {
          name: 'skip-npm',
          default: false,
          aliases: ['sn'],
          key: 'skipNpm',
          required: false
        },
        {
          name: 'skip-bower',
          default: false,
          aliases: ['sb'],
          key: 'skipBower',
          required: false
        },
        {
          name: 'skip-git',
          default: false,
          aliases: ['sg'],
          key: 'skipGit',
          required: false
        },
        {
          name: 'directory',
          aliases: ['dir'],
          key: 'directory',
          required: false
        }
      ],
      anonymousOptions: ['<addon-name>']
    },
    {
      name: 'build',
      description: 'Builds your app and places it into the output path (dist/ by default).',
      aliases: ['b'],
      works: 'insideProject',
      availableOptions: [
        {
          name: 'environment',
          default: 'development',
          aliases: [
            'e',
            { dev: 'development' },
            { prod: 'production' }
          ],
          key: 'environment',
          required: false
        },
        {
          name: 'output-path',
          type: 'path',
          default: 'dist/',
          aliases: ['o'],
          key: 'outputPath',
          required: false
        },
        {
          name: 'watch',
          default: false,
          aliases: ['w'],
          key: 'watch',
          required: false
        },
        {
          name: 'watcher',
          key: 'watcher',
          required: false
        },
        {
          name: 'suppress-sizes',
          default: false,
          key: 'suppressSizes',
          required: false
        }
      ],
      anonymousOptions: []
    },
    {
      name: 'destroy',
      description: 'Destroys code generated by `generate` command.',
      aliases: ['d'],
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
      anonymousOptions: ['<blueprint>']
    },
    {
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
                  type: 'String',
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
                  type: 'String',
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
              name: 'instance-initializer',
              description: 'Generates an instance initializer.',
              availableOptions: [],
              anonymousOptions: ['name'],
              overridden: false
            },
            {
              name: 'instance-initializer-addon',
              description: 'Generates an import wrapper.',
              availableOptions: [],
              anonymousOptions: ['name'],
              overridden: false
            },
            {
              name: 'instance-initializer-test',
              description: 'Generates an instance initializer unit test.',
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
              description: 'Generates a model, template, route, and registers the route with the router.',
              availableOptions: [],
              anonymousOptions: ['name'],
              overridden: false
            },
            {
              name: 'route',
              description: 'Generates a route and a template, and registers the route with the router.',
              availableOptions: [
                {
                  name: 'path',
                  type: 'String',
                  default: '',
                  key: 'path',
                  required: false
                },
                {
                  name: 'skip-router',
                  type: 'Boolean',
                  default: false,
                  key: 'skipRouter',
                  required: false
                },
                {
                  name: 'reset-namespace',
                  type: 'Boolean',
                  key: 'resetNamespace',
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
              name: 'vendor-shim',
              description: 'Generates an ES6 module shim for global libraries.',
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
    },
    {
      name: 'help',
      description: 'Outputs the usage instructions for all commands or the provided command',
      aliases: [null, 'h', '--help', '-h'],
      works: 'everywhere',
      availableOptions: [
        {
          name: 'verbose',
          default: false,
          aliases: ['v'],
          key: 'verbose',
          required: false
        },
        {
          name: 'json',
          default: false,
          key: 'json',
          required: false
        }
      ],
      anonymousOptions: ['<command-name (Default: all)>']
    },
    {
      name: 'init',
      description: 'Creates a new ember-cli project in the current folder.',
      aliases: [],
      works: 'everywhere',
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
          name: 'blueprint',
          aliases: ['b'],
          key: 'blueprint',
          required: false
        },
        {
          name: 'skip-npm',
          default: false,
          aliases: ['sn'],
          key: 'skipNpm',
          required: false
        },
        {
          name: 'skip-bower',
          default: false,
          aliases: ['sb'],
          key: 'skipBower',
          required: false
        },
        {
          name: 'name',
          default: '',
          aliases: ['n'],
          key: 'name',
          required: false
        }
      ],
      anonymousOptions: ['<glob-pattern>']
    },
    {
      name: 'install',
      description: 'Installs an ember-cli addon from npm.',
      aliases: ['i'],
      works: 'insideProject',
      availableOptions: [],
      anonymousOptions: ['<addon-name>']
    },
    {
      name: 'new',
      description: processHelpString('Creates a new directory and runs \u001b[32member init\u001b[39m in it.'),
      aliases: [],
      works: 'outsideProject',
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
          name: 'blueprint',
          default: 'app',
          aliases: ['b'],
          key: 'blueprint',
          required: false
        },
        {
          name: 'skip-npm',
          default: false,
          aliases: ['sn'],
          key: 'skipNpm',
          required: false
        },
        {
          name: 'skip-bower',
          default: false,
          aliases: ['sb'],
          key: 'skipBower',
          required: false
        },
        {
          name: 'skip-git',
          default: false,
          aliases: ['sg'],
          key: 'skipGit',
          required: false
        },
        {
          name: 'directory',
          aliases: ['dir'],
          key: 'directory',
          required: false
        }
      ],
      anonymousOptions: ['<app-name>']
    },
    {
      name: 'serve',
      description: 'Builds and serves your app, rebuilding on file changes.',
      aliases: ['server', 's'],
      works: 'insideProject',
      availableOptions: [
        {
          name: 'port',
          default: 4200,
          aliases: ['p'],
          key: 'port',
          required: false
        },
        {
          name: 'host',
          description: 'Listens on all interfaces by default',
          aliases: ['H'],
          key: 'host',
          required: false
        },
        {
          name: 'proxy',
          aliases: ['pr', 'pxy'],
          key: 'proxy',
          required: false
        },
        {
          name: 'insecure-proxy',
          default: false,
          description: 'Set false to proxy self-signed SSL certificates',
          aliases: ['inspr'],
          key: 'insecureProxy',
          required: false
        },
        {
          name: 'watcher',
          default: 'events',
          aliases: ['w'],
          key: 'watcher',
          required: false
        },
        {
          name: 'live-reload',
          default: true,
          aliases: ['lr'],
          key: 'liveReload',
          required: false
        },
        {
          name: 'live-reload-host',
          description: 'Defaults to host',
          aliases: ['lrh'],
          key: 'liveReloadHost',
          required: false
        },
        {
          aliases: ['lrbu'],
          description: 'Defaults to baseURL',
          key: 'liveReloadBaseUrl',
          name: 'live-reload-base-url',
          required: false
        },
        {
          name: 'live-reload-port',
          description: '(Defaults to port number within [49152...65535])',
          aliases: ['lrp'],
          key: 'liveReloadPort',
          required: false
        },
        {
          name: 'environment',
          default: 'development',
          aliases: [
            'e',
            { dev: 'development' },
            { prod: 'production' }
          ],
          key: 'environment',
          required: false
        },
        {
          name: 'output-path',
          type: 'path',
          default: 'dist/',
          aliases: ['op', 'out'],
          key: 'outputPath',
          required: false
        },
        {
          name: 'ssl',
          default: false,
          key: 'ssl',
          required: false
        },
        {
          name: 'ssl-key',
          default: 'ssl/server.key',
          key: 'sslKey',
          required: false
        },
        {
          name: 'ssl-cert',
          default: 'ssl/server.crt',
          key: 'sslCert',
          required: false
        }
      ],
      anonymousOptions: []
    },
    {
      name: 'show-asset-sizes',
      description: 'Show asset file sizes.',
      works: 'insideProject',
      aliases: [],
      anonymousOptions: [],
      availableOptions: [
        {
          name: 'output-path',
          default: 'dist/',
          type: 'path',
          key: 'outputPath',
          required: false,
          aliases: ['o']
        }
      ]
    },
    {
      name: 'test',
      description: 'Runs your app\'s test suite.',
      aliases: ['t'],
      works: 'insideProject',
      availableOptions: [
        {
          name: 'environment',
          default: 'test',
          aliases: ['e'],
          key: 'environment',
          required: false
        },
        {
          name: 'config-file',
          aliases: ['c', 'cf'],
          key: 'configFile',
          required: false
        },
        {
          name: 'server',
          default: false,
          aliases: ['s'],
          key: 'server',
          required: false
        },
        {
          name: 'host',
          aliases: ['H'],
          key: 'host',
          required: false
        },
        {
          name: 'test-port',
          default: 7357,
          description: 'The test port to use when running with --server.',
          aliases: ['tp'],
          key: 'testPort',
          required: false
        },
        {
          name: 'filter',
          description: 'A string to filter tests to run',
          aliases: ['f'],
          key: 'filter',
          required: false
        },
        {
          name: 'module',
          description: 'The name of a test module to run',
          aliases: ['m'],
          key: 'module',
          required: false
        },
        {
          name: 'watcher',
          default: 'events',
          aliases: ['w'],
          key: 'watcher',
          required: false
        },
        {
          name: 'launch',
          default: false,
          description: 'A comma separated list of browsers to launch for tests.',
          key: 'launch',
          required: false
        },
        {
          name: 'reporter',
          description: 'Test reporter to use [tap|dot|xunit] (default: tap)',
          aliases: ['r'],
          key: 'reporter',
          required: false
        },
        {
          name: 'silent',
          default: false,
          description: 'Suppress any output except for the test report',
          key: 'silent',
          required: false
        },
        {
          name: 'test-page',
          description: 'Test page to invoke',
          key: 'testPage',
          required: false
        },
        {
          name: 'path',
          description: 'Reuse an existing build at given path.',
          key: 'path',
          required: false
        },
        {
          name: 'query',
          description: 'A query string to append to the test page URL.',
          key: 'query',
          required: false
        }
      ],
      anonymousOptions: []
    },
    {
      name: 'version',
      description: 'outputs ember-cli version',
      aliases: ['v', '--version', '-v'],
      works: 'everywhere',
      availableOptions: [
        {
          name: 'verbose',
          default: false,
          key: 'verbose',
          required: false
        }
      ],
      anonymousOptions: []
    }
  ],
  addons: [
    {
      name: 'dummy-addon',
      commands: [
        {
          name: 'foo',
          description: 'Initializes the warp drive.',
          aliases: [],
          works: 'insideProject',
          availableOptions: [
            {
              aliases: [
                'd'
              ],
              default: false,
              key: 'dryRun',
              name: 'dry-run',
              required: false
            }
          ],
          anonymousOptions: [
            '<speed>'
          ]
        }
      ]
    }
  ]
};
