'use strict';

var expect        = require('chai').expect;
var MockUI        = require('../../../helpers/mock-ui');
var MockAnalytics = require('../../../helpers/mock-analytics');
var convertToJson = require('../../../helpers/convert-help-output-to-json');
var HelpCommand   = require('../../../../lib/commands/help');
var TestCommand   = require('../../../../lib/commands/test');

describe('help command: test json', function() {
  var ui, command;

  beforeEach(function() {
    ui = new MockUI();

    var options = {
      ui: ui,
      analytics: new MockAnalytics(),
      commands: {
        'Test': TestCommand
      },
      project: {
        isEmberCLIProject: function() {
          return true;
        }
      },
      settings: {}
    };

    command = new HelpCommand(options);
  });

  it('works', function() {
    return command.validateAndRun(['test', '--json']).then(function() {
      var json = convertToJson(ui.output);

      var command = json.commands[0];
      expect(command).to.deep.equal({
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
            default: './testem.json',
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
            description: 'Test reporter to use [tap|dot|xunit]',
            aliases: ['r'],
            key: 'reporter',
            required: false
          },
          {
            name: 'test-page',
            description: 'Test page to invoke',
            key: 'testPage',
            required: false
          }
        ],
        anonymousOptions: []
      });
    });
  });

  it('works with alias t', function() {
    return command.validateAndRun(['t', '--json']).then(function() {
      var json = convertToJson(ui.output);

      var command = json.commands[0];
      expect(command.name).to.equal('test');
    });
  });
});
