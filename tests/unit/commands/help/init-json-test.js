'use strict';

var expect        = require('chai').expect;
var MockUI        = require('../../../helpers/mock-ui');
var MockAnalytics = require('../../../helpers/mock-analytics');
var convertToJson = require('../../../helpers/convert-help-output-to-json');
var HelpCommand   = require('../../../../lib/commands/help');
var InitCommand   = require('../../../../lib/commands/init');

describe('help command: init json', function() {
  var ui, command;

  beforeEach(function() {
    ui = new MockUI();

    var options = {
      ui: ui,
      analytics: new MockAnalytics(),
      commands: {
        'Init': InitCommand
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
    return command.validateAndRun(['init', '--json']).then(function() {
      var json = convertToJson(ui.output);

      var command = json.commands[0];
      expect(command).to.deep.equal({
        name: 'init',
        description: 'Creates a new ember-cli project in the current folder.',
        aliases: ['i'],
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
      });
    });
  });

  it('works with alias i', function() {
    return command.validateAndRun(['i', '--json']).then(function() {
      var json = convertToJson(ui.output);

      var command = json.commands[0];
      expect(command.name).to.equal('init');
    });
  });
});
