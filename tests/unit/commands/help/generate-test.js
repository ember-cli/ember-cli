/*jshint multistr: true */

'use strict';

var expect            = require('chai').expect;
var EOL               = require('os').EOL;
var proxyquire        = require('proxyquire');
var MockUI            = require('../../../helpers/mock-ui');
var MockAnalytics     = require('../../../helpers/mock-analytics');
var processHelpString = require('../../../helpers/process-help-string');
var Blueprint         = require('../../../../lib/models/blueprint');
var HelpCommand       = require('../../../../lib/commands/help');

var blueprintListStub;
var GenerateCommand = proxyquire('../../../../lib/commands/generate', {
  '../models/blueprint': {
    list: function() {
      return blueprintListStub.apply(this, arguments);
    }
  }
});

describe('help command: generate', function() {
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
    return command.validateAndRun(['generate']).then(function() {
      var output = ui.output;

      var testString = processHelpString(EOL + '\
ember generate \u001b[33m<blueprint>\u001b[39m \u001b[36m<options...>\u001b[39m' + EOL + '\
  Generates new code from blueprints.' + EOL + '\
  \u001b[90maliases: g\u001b[39m' + EOL + '\
  \u001b[36m--dry-run\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
    \u001b[90maliases: -d\u001b[39m' + EOL + '\
  \u001b[36m--verbose\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
    \u001b[90maliases: -v\u001b[39m' + EOL + '\
  \u001b[36m--pod\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
    \u001b[90maliases: -p\u001b[39m' + EOL + '\
  \u001b[36m--classic\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
    \u001b[90maliases: -c\u001b[39m' + EOL + '\
  \u001b[36m--dummy\u001b[39m \u001b[36m(Boolean)\u001b[39m \u001b[36m(Default: false)\u001b[39m' + EOL + '\
    \u001b[90maliases: -dum, -id\u001b[39m' + EOL + '\
  \u001b[36m--in-repo-addon\u001b[39m \u001b[36m(String)\u001b[39m \u001b[36m(Default: null)\u001b[39m' + EOL + '\
    \u001b[90maliases: -in-repo <value>, -ir <value>\u001b[39m' + EOL + '\
' + EOL + '\
' + EOL + '\
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
        \u001b[90mGenerates a route and registers it with the router.\u001b[39m' + EOL + '\
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
        \u001b[90mGenerates a view unit test.\u001b[39m' + EOL);

      expect(output).to.include(testString);
    });
  });

  it('works with alias g', function() {
    return command.validateAndRun(['g']).then(function() {
      var output = ui.output;

      var testString = processHelpString('ember generate \u001b[33m<blueprint>\u001b[39m \u001b[36m<options...>\u001b[39m');

      expect(output).to.include(testString);
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
      rawArgs: ['missing-blueprint']
    };

    command.printDetailedHelp(options);

    var output = ui.output;

    var testString = processHelpString('\
\u001b[33mThe \'missing-blueprint\' blueprint does not exist in this project.\u001b[39m' + EOL + EOL);

    expect(output).to.include(testString);
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
              anonymousOptions: []
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
      rawArgs: ['my-blueprint']
    };

    command.printDetailedHelp(options);

    var output = ui.output;

    var testString = processHelpString('\
      my-blueprint' + EOL + EOL);

    expect(output).to.include(testString);
  });
});
